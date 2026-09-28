import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deployRelease, assertCurrentState } from "./release-deploy.mjs";
import { assertReleaseManifest } from "./release-plan.mjs";
import { withAwsObjectStore } from "./release-upload.mjs";
import { createReleaseRuntime } from "./release-cloudfront.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bucket = process.env.S3_BUCKET;
const { cdn, mainHead, smoke } = createReleaseRuntime({
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  domain: process.env.CLOUDFRONT_DOMAIN,
  token: process.env.GITHUB_TOKEN,
});

const manifest = assertReleaseManifest(JSON.parse(await readFile(path.join(root,
  ".cache/release-manifest.json"), "utf8")));
if (manifest.sourceRevision !== process.env.GITHUB_SHA) throw new Error("Release manifest commit mismatch");

await withAwsObjectStore(bucket, async (store) => {
  const previousBytes = await store.getOptionalCurrent();
  const current = previousBytes ? assertCurrentState(JSON.parse(previousBytes.toString("utf8"))) : null;
  const state = await deployRelease({ candidate: manifest, current,
    exportDirectory: path.join(root, "out"), store, cdn, readBranchHead: mainHead, smoke });
  console.info(`Published ${state.releaseId} (${state.sourceRevision}) at ${state.publicationTime}`);
});
