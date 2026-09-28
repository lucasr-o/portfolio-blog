import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPublication } from "@portfolio/blog-content/publication";
import { assertCurrentState } from "./release-deploy.mjs";
import { withAwsObjectStore } from "./release-upload.mjs";

export function shouldDeploy({ eventName, sourceRevision, eligibleSlugs, current }) {
  if (eventName === "push" || eventName === "workflow_dispatch") return true;
  if (eventName !== "schedule") throw new Error("Unsupported release trigger");
  assertCurrentState(current);
  if (!current || current.sourceRevision !== sourceRevision) return true;
  const previous = [...current.manifest.posts].sort();
  return JSON.stringify([...eligibleSlugs].sort()) !== JSON.stringify(previous);
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
  const current = await withAwsObjectStore(process.env.S3_BUCKET, async (store) => {
    const bytes = await store.getOptionalCurrent();
    return bytes ? assertCurrentState(JSON.parse(bytes.toString("utf8"))) : null;
  });
  const deploy = shouldDeploy({ eventName, sourceRevision,
    eligibleSlugs: publication.posts.map((post) => post.slug), current });
  await appendFile(path.resolve(outputFile), `deploy=${deploy}\n`);
  console.info(`Preflight: ${deploy ? "release required" : "unchanged"}; ${publication.posts.length} eligible posts at ${cutoff}`);
}

if (process.argv[1] && import.meta.url.startsWith("file:") &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await run();
