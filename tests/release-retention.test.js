import { describe, expect, it } from "vitest";
import { planRetention } from "../scripts/release-retention.mjs";
import { classifySiteFile } from "../scripts/release-plan.mjs";

const sha = "a".repeat(40);
const id = (run) => `${sha}-${run}-1`;
const manifest = (run) => ({ schema: 1, releaseId: id(run), sourceRevision: sha,
  publicationTime: "2026-08-01T00:00:00.000Z", posts: [], files: [], mutableKeys: [] });
const object = (run, suffix, date) => ({ Key: `releases/${id(run)}/${suffix}`, LastModified: date });

describe("release snapshot retention", () => {
  it("protects the active release, five latest successes and all recent snapshots", () => {
    const old = "2026-07-01T00:00:00.000Z";
    const recent = "2026-09-20T00:00:00.000Z";
    const objects = [];
    const manifests = {};
    for (let run = 1; run <= 9; run += 1) {
      manifests[id(run)] = manifest(run);
      objects.push(object(run, "manifest.json", run === 8 ? recent : old));
      if (run <= 7) objects.push(object(run, "success.json", new Date(Date.parse(old) + run * 1000).toISOString()));
    }
    const plan = planRetention({ activeReleaseId: id(1), objects, manifests,
      now: "2026-09-28T00:00:00.000Z" });
    expect(plan.protectedIds).toContain(id(1));
    for (let run = 3; run <= 7; run += 1) expect(plan.protectedIds).toContain(id(run));
    expect(plan.deleteKeys).toEqual([object(2, "manifest.json", old).Key,
      object(2, "success.json", old).Key, object(9, "manifest.json", old).Key]);
    expect(plan.deleteKeys.some((key) => key.includes(`/${id(8)}/`))).toBe(false);
  });

  it("skips unrecorded keys and missing manifests rather than deleting a prefix", () => {
    const old = "2026-07-01T00:00:00.000Z";
    const objects = [object(2, "manifest.json", old), object(2, "unknown.bin", old),
      object(3, "files/partial.png", old)];
    const plan = planRetention({ activeReleaseId: id(1), objects,
      manifests: { [id(2)]: manifest(2) }, now: "2026-09-28T00:00:00.000Z" });
    expect(plan.deleteKeys).toEqual([]);
    expect(plan.skipped).toEqual([{ id: id(2), reason: "unrecorded object" },
      { id: id(3), reason: "missing manifest" }]);
  });

  it("removes old versioned bundles only when no retained manifest uses them", () => {
    const old = "2026-07-01T00:00:00.000Z";
    const file = (name) => ({ path: `_next/static/${name}.js`, key: `site/_next/static/${name}.js`,
      sha256: "b".repeat(64), bytes: 1, ...classifySiteFile(`_next/static/${name}.js`) });
    const obsolete = { ...manifest(2), files: [file("unused"), file("shared")] };
    const retained = { ...manifest(3), files: [file("shared")] };
    const objects = [object(2, "manifest.json", old), object(2, "files/_next/static/unused.js", old),
      object(2, "files/_next/static/shared.js", old), object(3, "manifest.json", old),
      object(3, "files/_next/static/shared.js", old)];
    const plan = planRetention({ activeReleaseId: id(3), objects,
      manifests: { [id(2)]: obsolete, [id(3)]: retained },
      now: "2026-09-28T00:00:00.000Z" });
    expect(plan.deletePublicAssets).toEqual(["site/_next/static/unused.js"]);
    expect(plan.deleteKeys.every((key) => key.startsWith(`releases/${id(2)}/`))).toBe(true);
  });
});
