import { assertReleaseManifest } from "./release-plan.mjs";

const RELEASE_OBJECT = /^releases\/([a-f0-9]{40}-[0-9]{1,20}-[1-9][0-9]*)\/(.+)$/;

export function planRetention({ activeReleaseId, objects, manifests, now,
  keepSuccessful = 5, keepDays = 30 }) {
  if (!Array.isArray(objects) || !Number.isFinite(Date.parse(now)) ||
      !Number.isSafeInteger(keepSuccessful) || keepSuccessful < 5 ||
      !Number.isSafeInteger(keepDays) || keepDays < 30) {
    throw new Error("Invalid retention input");
  }
  const groups = new Map();
  for (const object of objects) {
    const match = RELEASE_OBJECT.exec(object.Key ?? "");
    if (!match) continue;
    const modified = Date.parse(object.LastModified);
    if (!Number.isFinite(modified)) throw new Error(`Release object lacks a valid date: ${object.Key}`);
    const [, id, suffix] = match;
    const group = groups.get(id) ?? { id, files: [], latest: 0, successTime: 0 };
    group.files.push(object.Key);
    group.latest = Math.max(group.latest, modified);
    if (suffix === "success.json") group.successTime = modified;
    groups.set(id, group);
  }
  const successes = [...groups.values()].filter((group) => group.successTime)
    .sort((left, right) => right.successTime - left.successTime || right.id.localeCompare(left.id));
  const protectedIds = new Set([activeReleaseId, ...successes.slice(0, keepSuccessful).map((item) => item.id)]);
  const recentThreshold = Date.parse(now) - keepDays * 86_400_000;
  const deleteKeys = [];
  const deletedIds = new Set();
  const skipped = [];
  for (const group of groups.values()) {
    if (protectedIds.has(group.id) || group.latest >= recentThreshold) continue;
    const manifest = manifests[group.id];
    if (!manifest) { skipped.push({ id: group.id, reason: "missing manifest" }); continue; }
    assertReleaseManifest(manifest);
    if (manifest.releaseId !== group.id) throw new Error(`Snapshot ID mismatch: ${group.id}`);
    const allowed = new Set([`releases/${group.id}/manifest.json`,
      `releases/${group.id}/success.json`,
      ...manifest.files.map((file) => `releases/${group.id}/files/${file.path}`)]);
    if (group.files.some((key) => !allowed.has(key))) {
      skipped.push({ id: group.id, reason: "unrecorded object" });
      continue;
    }
    deleteKeys.push(...group.files);
    deletedIds.add(group.id);
  }
  let deletePublicAssets = [];
  const retained = [...groups.values()].filter((group) => !deletedIds.has(group.id));
  // An unverified retained snapshot might reference any older asset. Keep all
  // public bundles rather than guessing if its manifest cannot be inspected.
  if (retained.every((group) => manifests[group.id])) {
    const retainedAssets = new Set(retained.flatMap((group) => {
      const manifest = assertReleaseManifest(manifests[group.id]);
      return manifest.files.filter((file) => file.immutable).map((file) => file.key);
    }));
    deletePublicAssets = [...new Set([...deletedIds].flatMap((id) =>
      manifests[id].files.filter((file) => file.immutable).map((file) => file.key)))]
      .filter((key) => !retainedAssets.has(key)).sort();
  }
  return { deleteKeys: deleteKeys.sort(), deletePublicAssets,
    protectedIds: [...protectedIds].filter(Boolean).sort(), skipped };
}
