import { planRetention } from "./release-retention.mjs";
import { assertCurrentState } from "./release-deploy.mjs";
import { withAwsObjectStore } from "./release-upload.mjs";

await withAwsObjectStore(process.env.S3_BUCKET, async (store) => {
  const activeBytes = await store.getOptionalCurrent();
  if (!activeBytes) throw new Error("No active release; refusing retention cleanup");
  const active = assertCurrentState(JSON.parse(activeBytes.toString("utf8")));
  const objects = await store.listReleaseObjects();
  const manifestKeys = objects.map((entry) => entry.Key)
    .filter((key) => /^releases\/[a-f0-9]{40}-[0-9]{1,20}-[1-9][0-9]*\/manifest\.json$/.test(key));
  const manifests = {};
  for (const key of manifestKeys) {
    const id = key.split("/")[1];
    const bytes = await store.getObject(key);
    manifests[id] = JSON.parse(bytes.toString("utf8"));
  }
  const plan = planRetention({ activeReleaseId: active.releaseId,
    objects, manifests, now: new Date().toISOString() });
  console.info(`Retention: ${plan.protectedIds.length} protected release IDs, ${plan.deleteKeys.length} snapshot objects and ${plan.deletePublicAssets.length} unreferenced old bundles eligible, ${plan.skipped.length} unverified release IDs skipped.`);
  if (process.env.PRUNE_CONFIRM !== "yes") {
    console.info("Dry run; no objects deleted. Set PRUNE_CONFIRM=yes only in the dedicated maintenance workflow.");
    return;
  }
  for (const key of plan.deleteKeys) await store.deleteObject(key);
  for (const key of plan.deletePublicAssets) await store.deleteObject(key);
  console.info(`Deleted ${plan.deleteKeys.length} recorded old snapshot objects and ${plan.deletePublicAssets.length} unreferenced old bundles.`);
});
