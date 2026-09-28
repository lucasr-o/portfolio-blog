import { createHash } from "node:crypto";
import { assertReleaseManifest } from "./release-plan.mjs";
import { uploadRelease } from "./release-upload.mjs";

const CURRENT_KEY = "state/current-release.json";
const digest = (value) => createHash("sha256").update(value).digest("hex");

export function assertCurrentState(current) {
  if (current === null) return null;
  if (current?.schema !== 1 || !current.manifest ||
      current.releaseId !== current.manifest.releaseId ||
      current.sourceRevision !== current.manifest.sourceRevision ||
      current.publicationTime !== current.manifest.publicationTime) {
    throw new Error("Invalid current release state");
  }
  assertReleaseManifest(current.manifest);
  return current;
}

export function assertCandidateFresh(candidate, current, branchHead) {
  assertReleaseManifest(candidate);
  assertCurrentState(current);
  if (candidate.sourceRevision !== branchHead) throw new Error("Candidate is no longer main HEAD");
  if (current && candidate.sourceRevision === current.sourceRevision &&
      candidate.publicationTime < current.publicationTime) {
    throw new Error("Candidate publication cutoff precedes the active release");
  }
  if (current?.releaseId === candidate.releaseId) throw new Error("Release already active");
}

const staleMutableKeys = (before, after) => {
  const next = new Set(after?.mutableKeys ?? []);
  return (before?.mutableKeys ?? []).filter((key) => !next.has(key));
};

export async function restorePrevious({ current, candidate, store, cdn, smoke }) {
  if (current) {
    const prefix = `releases/${current.releaseId}/files/`;
    const files = [];
    // Read and validate the complete original snapshot before changing public objects.
    for (const file of current.manifest.files) {
      const bytes = await store.getObject(`${prefix}${file.path}`);
      if (bytes.length !== file.bytes || digest(bytes) !== file.sha256) {
        throw new Error(`Corrupt retained snapshot: ${file.path}`);
      }
      files.push({ file, bytes });
    }
    for (const { file, bytes } of files) {
      await store.putObject(file.key, bytes, { contentType: file.contentType,
        cacheControl: file.cacheControl });
    }
    for (const key of staleMutableKeys(candidate, current.manifest)) {
      await store.deleteObject(key);
    }
    await cdn.invalidateAndWait("/*");
    await smoke(current.manifest);
    await store.putObject(CURRENT_KEY, Buffer.from(JSON.stringify(current)), {
      contentType: "application/json", cacheControl: "private, no-store",
    });
    return "previous snapshot restored";
  }
  // First release had no successful predecessor; remove only its mutable keys.
  for (const key of candidate.mutableKeys) await store.deleteObject(key);
  await cdn.invalidateAndWait("/*");
  await store.deleteObject(CURRENT_KEY);
  return "first release withdrawn; no previous release existed";
}

export async function deployRelease({ candidate, current, exportDirectory, store,
  cdn, readBranchHead, smoke, now = () => new Date().toISOString() }) {
  const branchHead = await readBranchHead();
  assertCandidateFresh(candidate, current, branchHead);
  let publicMutationStarted = false;
  const trackingStore = {
    ...store,
    async putObject(key, bytes, metadata) {
      if (key.startsWith("site/")) publicMutationStarted = true;
      await store.putObject(key, bytes, metadata);
    },
  };
  try {
    await uploadRelease({ manifest: candidate, exportDirectory, store: trackingStore,
      beforePublic: async () => assertCandidateFresh(candidate, current, await readBranchHead()),
    });
    for (const key of staleMutableKeys(current?.manifest, candidate)) {
      publicMutationStarted = true;
      await store.deleteObject(key);
    }
    await cdn.invalidateAndWait("/*");
    await smoke(candidate);
    const state = { schema: 1, releaseId: candidate.releaseId,
      sourceRevision: candidate.sourceRevision, publicationTime: candidate.publicationTime,
      completedAt: now(), manifest: candidate };
    await store.putObject(CURRENT_KEY, Buffer.from(JSON.stringify(state)), {
      contentType: "application/json", cacheControl: "private, no-store",
    });
    await store.putObject(`releases/${candidate.releaseId}/success.json`,
      Buffer.from(JSON.stringify({ releaseId: candidate.releaseId, completedAt: state.completedAt })), {
        contentType: "application/json", cacheControl: "private, no-store", createOnly: true,
      });
    return state;
  } catch (error) {
    if (!publicMutationStarted) throw error;
    try {
      const recovery = await restorePrevious({ current, candidate, store, cdn, smoke });
      throw new Error(`Release ${candidate.releaseId} failed; ${recovery}: ${error.message}`);
    } catch (recoveryError) {
      if (recoveryError.message.startsWith(`Release ${candidate.releaseId} failed;`)) throw recoveryError;
      throw new AggregateError([error, recoveryError],
        `Release ${candidate.releaseId} failed and recovery also failed`);
    }
  }
}
