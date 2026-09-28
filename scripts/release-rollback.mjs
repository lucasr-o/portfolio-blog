import { assertReleaseManifest } from "./release-plan.mjs";
import { assertCurrentState, restorePrevious } from "./release-deploy.mjs";

export async function rollbackRelease({ targetReleaseId, current, store, cdn, smoke,
  now = () => new Date().toISOString() }) {
  assertCurrentState(current);
  if (!current) throw new Error("No active release to roll back");
  if (!/^[a-f0-9]{40}-[0-9]{1,20}-[1-9][0-9]*$/.test(targetReleaseId ?? "")) {
    throw new Error("Invalid target release ID");
  }
  if (targetReleaseId === current.releaseId) throw new Error("Target release is already active");
  const targetBytes = await store.getObject(`releases/${targetReleaseId}/manifest.json`);
  const target = assertReleaseManifest(JSON.parse(targetBytes.toString("utf8")));
  if (target.releaseId !== targetReleaseId) throw new Error("Snapshot release ID mismatch");
  const successfulBytes = await store.getObject(`releases/${targetReleaseId}/success.json`);
  const successful = JSON.parse(successfulBytes.toString("utf8"));
  if (successful.releaseId !== targetReleaseId || !Number.isFinite(Date.parse(successful.completedAt))) {
    throw new Error("Target is not a recorded successful release");
  }
  const targetState = { schema: 1, releaseId: target.releaseId,
    sourceRevision: target.sourceRevision, publicationTime: target.publicationTime,
    completedAt: now(), rollbackOf: current.releaseId, manifest: target };
  try {
    await restorePrevious({ current: targetState, candidate: current.manifest, store, cdn, smoke });
    return targetState;
  } catch (error) {
    try {
      await restorePrevious({ current, candidate: target, store, cdn, smoke });
      throw new Error(`Rollback to ${targetReleaseId} failed; active release restored: ${error.message}`);
    } catch (recoveryError) {
      if (recoveryError.message.startsWith(`Rollback to ${targetReleaseId} failed;`)) throw recoveryError;
      throw new AggregateError([error, recoveryError], "Rollback and recovery both failed");
    }
  }
}
