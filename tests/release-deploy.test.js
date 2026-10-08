import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReleaseManifest } from "../scripts/release-plan.mjs";
import { uploadRelease } from "../scripts/release-upload.mjs";
import { deployRelease } from "../scripts/release-deploy.mjs";
import { rollbackRelease } from "../scripts/release-rollback.mjs";

const revision = "a".repeat(40);
const cutoff = "2026-09-28T00:00:00.000Z";

async function exportFixture(slug, runId) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-blog-deploy-test-"));
  await mkdir(join(root, `blog/${slug}`), { recursive: true });
  await mkdir(join(root, "_next/static"), { recursive: true });
  await mkdir(join(root, "blog-search"));
  for (const locale of ["en", "pt-BR"]) {
    await writeFile(join(root, `blog-search/${locale}.json`), JSON.stringify({ schema: 1, locale, posts: [], terms: {} }));
  }
  await writeFile(join(root, "index.html"), `home-${slug}`);
  await writeFile(join(root, "404.html"), "missing");
  await writeFile(join(root, `blog/${slug}/index.html`), `post-${slug}`);
  await writeFile(join(root, `_next/static/${slug}.js`), `client-${slug}`);
  const manifest = await buildReleaseManifest({ exportDirectory: root, sourceRevision: revision,
    releaseId: `${revision}-${runId}-1`, publicationTime: cutoff, posts: [slug] });
  return { root, manifest };
}

function memoryStore() {
  const objects = new Map();
  const calls = [];
  const store = {
    fail: null,
    async putObject(key, bytes) {
      objects.set(key, Buffer.from(bytes));
      calls.push(`put:${key}`);
      if (store.fail?.(`put:${key}`)) { store.fail = null; throw new Error("injected put failure"); }
    },
    async getObject(key) {
      calls.push(`get:${key}`);
      const value = objects.get(key);
      if (!value) throw new Error("missing retained snapshot");
      return value;
    },
    async deleteObject(key) {
      objects.delete(key);
      calls.push(`delete:${key}`);
      if (store.fail?.(`delete:${key}`)) { store.fail = null; throw new Error("injected delete failure"); }
    },
  };
  return { store, objects, calls };
}

describe("serialized release and recovery", () => {
  it("rejects stale candidates before touching production, including an older cutoff for the same commit", async () => {
    const candidate = await exportFixture("new", 2);
    try {
      const { store, calls } = memoryStore();
      await expect(deployRelease({ candidate: candidate.manifest, current: null,
        exportDirectory: candidate.root, store, cdn: {}, readBranchHead: async () => "b".repeat(40),
        smoke: async () => {} })).rejects.toThrow("HEAD");
      expect(calls).toEqual([]);
      const active = { schema: 1, releaseId: `${revision}-1-1`, sourceRevision: revision,
        publicationTime: "2026-09-29T00:00:00.000Z",
        manifest: { ...candidate.manifest, releaseId: `${revision}-1-1`, publicationTime: "2026-09-29T00:00:00.000Z" } };
      await expect(deployRelease({ candidate: candidate.manifest, current: active,
        exportDirectory: candidate.root, store, cdn: {}, readBranchHead: async () => revision,
        smoke: async () => {} })).rejects.toThrow("cutoff");
      expect(calls).toEqual([]);
    } finally { await rm(candidate.root, { recursive: true, force: true }); }
  });

  it("checks main again after saving the snapshot and before any public object", async () => {
    const candidate = await exportFixture("new", 2);
    try {
      const { store, calls } = memoryStore();
      let checks = 0;
      await expect(deployRelease({ candidate: candidate.manifest, current: null,
        exportDirectory: candidate.root, store, cdn: {},
        readBranchHead: async () => ++checks === 1 ? revision : "b".repeat(40),
        smoke: async () => {} })).rejects.toThrow("HEAD");
      expect(calls.some((call) => call.startsWith("put:releases/"))).toBe(true);
      expect(calls.some((call) => call.startsWith("put:site/"))).toBe(false);
    } finally { await rm(candidate.root, { recursive: true, force: true }); }
  });

  it("restores original bytes after upload, withdrawal, invalidation, smoke or state failure", async () => {
    for (const stage of ["upload", "withdraw", "invalidate", "smoke", "state"]) {
      const old = await exportFixture("old", 1);
      const next = await exportFixture("new", 2);
      try {
        const { store, objects, calls } = memoryStore();
        await uploadRelease({ manifest: old.manifest, exportDirectory: old.root, store });
        const active = { schema: 1, releaseId: old.manifest.releaseId,
          sourceRevision: revision, publicationTime: cutoff, manifest: old.manifest };
        objects.set("state/current-release.json", Buffer.from(JSON.stringify(active)));
        calls.length = 0;
        let invalidations = 0;
        let smokeCalls = 0;
        if (stage === "upload") store.fail = (call) => call === "put:site/blog/new/index.html";
        if (stage === "withdraw") store.fail = (call) => call === "delete:site/blog/old/index.html";
        if (stage === "state") store.fail = (call) => call === "put:state/current-release.json";
        const cdn = { async invalidateAndWait() {
          invalidations += 1;
          if (stage === "invalidate" && invalidations === 1) throw new Error("injected invalidation failure");
        } };
        const smoke = async (manifest) => {
          smokeCalls += 1;
          if (stage === "smoke" && manifest.releaseId === next.manifest.releaseId) {
            throw new Error("injected smoke failure");
          }
        };
        await expect(deployRelease({ candidate: next.manifest, current: active,
          exportDirectory: next.root, store, cdn, readBranchHead: async () => revision,
          smoke })).rejects.toThrow("failed");
        expect(objects.get("site/index.html")?.toString(), stage).toBe("home-old");
        expect(objects.get("site/blog/old/index.html")?.toString(), stage).toBe("post-old");
        expect(objects.has("site/blog/new/index.html"), stage).toBe(false);
        expect(objects.has("site/_next/static/old.js"), stage).toBe(true);
        expect(JSON.parse(objects.get("state/current-release.json")).releaseId, stage).toBe(old.manifest.releaseId);
        expect(invalidations, stage).toBeGreaterThanOrEqual(1);
        expect(smokeCalls, stage).toBeGreaterThanOrEqual(1);
      } finally {
        await rm(old.root, { recursive: true, force: true });
        await rm(next.root, { recursive: true, force: true });
      }
    }
  });

  it("withdraws mutable files if the first release fails with no predecessor", async () => {
    const candidate = await exportFixture("new", 1);
    try {
      const { store, objects } = memoryStore();
      await expect(deployRelease({ candidate: candidate.manifest, current: null,
        exportDirectory: candidate.root, store,
        cdn: { async invalidateAndWait() {} }, readBranchHead: async () => revision,
        smoke: async () => { throw new Error("injected smoke failure"); } })).rejects.toThrow("withdrawn");
      expect(objects.has("site/index.html")).toBe(false);
      expect(objects.has("state/current-release.json")).toBe(false);
      expect(objects.has("site/_next/static/new.js")).toBe(true);
    } finally { await rm(candidate.root, { recursive: true, force: true }); }
  });

  it("rolls back using retained bytes and refuses a snapshot without a success record", async () => {
    const old = await exportFixture("old", 1);
    const next = await exportFixture("new", 2);
    try {
      const { store, objects } = memoryStore();
      await uploadRelease({ manifest: old.manifest, exportDirectory: old.root, store });
      await uploadRelease({ manifest: next.manifest, exportDirectory: next.root, store });
      const active = { schema: 1, releaseId: next.manifest.releaseId,
        sourceRevision: revision, publicationTime: cutoff, manifest: next.manifest };
      objects.set("state/current-release.json", Buffer.from(JSON.stringify(active)));
      const operation = () => rollbackRelease({ targetReleaseId: old.manifest.releaseId,
        current: active, store, cdn: { async invalidateAndWait() {} }, smoke: async () => {} });
      await expect(operation()).rejects.toThrow("missing retained snapshot");
      objects.set(`releases/${old.manifest.releaseId}/success.json`,
        Buffer.from(JSON.stringify({ releaseId: old.manifest.releaseId, completedAt: cutoff })));
      const restored = await operation();
      expect(restored.rollbackOf).toBe(next.manifest.releaseId);
      expect(objects.get("site/index.html")?.toString()).toBe("home-old");
      expect(objects.has("site/blog/new/index.html")).toBe(false);
      expect(objects.has("site/_next/static/new.js")).toBe(true);
      expect(JSON.parse(objects.get("state/current-release.json")).releaseId).toBe(old.manifest.releaseId);
    } finally {
      await rm(old.root, { recursive: true, force: true });
      await rm(next.root, { recursive: true, force: true });
    }
  });
});
