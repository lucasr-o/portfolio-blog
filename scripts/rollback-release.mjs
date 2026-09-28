import { rollbackRelease } from "./release-rollback.mjs";
import { assertCurrentState } from "./release-deploy.mjs";
import { withAwsObjectStore } from "./release-upload.mjs";
import { createReleaseRuntime } from "./release-cloudfront.mjs";

const targetReleaseId = process.env.TARGET_RELEASE_ID;
const { cdn, smoke } = createReleaseRuntime({
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  domain: process.env.CLOUDFRONT_DOMAIN,
});
await withAwsObjectStore(process.env.S3_BUCKET, async (store) => {
  const stateBytes = await store.getOptionalCurrent();
  if (!stateBytes) throw new Error("No active production release state");
  const current = assertCurrentState(JSON.parse(stateBytes.toString("utf8")));
  const state = await rollbackRelease({ targetReleaseId, current, store, cdn, smoke });
  console.info(`Restored ${state.releaseId} from its saved artifact; previous active release: ${current.releaseId}`);
});
