import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPublication } from "@portfolio/blog-content/publication";
import { assertCurrentState } from "./release-deploy.mjs";
import { withAwsObjectStore } from "./release-upload.mjs";
import { computePublicFingerprint } from "./public-fingerprint.mjs";

export function shouldDeploy({ eventName, fingerprint, current }) {
  if (eventName !== "push" && eventName !== "workflow_dispatch") throw new Error("Unsupported release trigger");
  assertCurrentState(current);
  if (eventName === "workflow_dispatch") return true;
  if (!/^[a-f0-9]{64}$/.test(fingerprint ?? "")) throw new Error("Invalid public fingerprint");
  return !current?.manifest.publicFingerprint || current.manifest.publicFingerprint !== fingerprint;
}

async function run() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const sourceRevision = process.env.GITHUB_SHA;
  const eventName = process.env.GITHUB_EVENT_NAME;
  const cutoff = process.env.BLOG_PUBLICATION_TIME;
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!/^[a-f0-9]{40}$/.test(sourceRevision ?? "") || !outputFile ||
      !Number.isFinite(Date.parse(cutoff))) throw new Error("Invalid preflight context");
  const publication = await loadPublication(root, cutoff);
  const fingerprint = await computePublicFingerprint(root, publication);
  const current = await withAwsObjectStore(process.env.S3_BUCKET, async (store) => {
    const bytes = await store.getOptionalCurrent();
    return bytes ? assertCurrentState(JSON.parse(bytes.toString("utf8"))) : null;
  });
  const deploy = shouldDeploy({ eventName, fingerprint, current });
  await appendFile(path.resolve(outputFile), `deploy=${deploy}\n`);
  console.info(`Preflight: ${deploy ? "release required" : "public output unchanged"}; ${publication.posts.length} English and ${publication.ptPosts.length} Portuguese posts.`);
}

if (process.argv[1] && import.meta.url.startsWith("file:") &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await run();
