import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReleaseManifest } from "../scripts/release-plan.mjs";
import { uploadRelease, withAwsObjectStore } from "../scripts/release-upload.mjs";

async function fixture(callback) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-blog-upload-test-"));
  try {
    await mkdir(join(root, "_next/static"), { recursive: true });
    await mkdir(join(root, "blog-search"));
    for (const locale of ["en", "pt-BR"]) {
      await writeFile(join(root, `blog-search/${locale}.json`), JSON.stringify({ schema: 1, locale, posts: [], terms: {} }));
    }
    await writeFile(join(root, "index.html"), "home");
    await writeFile(join(root, "404.html"), "missing");
    await writeFile(join(root, "_next/static/main-123.js"), "client");
    const manifest = await buildReleaseManifest({ exportDirectory: root,
      sourceRevision: "a".repeat(40), releaseId: `${"a".repeat(40)}-123-1`,
      publicationTime: "2026-09-28T00:00:00.000Z", posts: [] });
    return await callback(root, manifest);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("ordered release upload", () => {
  it("saves the full private snapshot before assets and mutable public documents", async () => fixture(async (root, manifest) => {
    const calls = [];
    const store = { async putObject(key, bytes, metadata) {
      calls.push({ key, content: bytes.toString(), metadata });
    } };
    const result = await uploadRelease({ manifest, exportDirectory: root, store });
    expect(result.uploaded).toBe(5);
    const snapshotPrefix = `releases/${manifest.releaseId}/`;
    expect(calls.slice(0, 5).every((call) => call.key.startsWith(snapshotPrefix + "files/"))).toBe(true);
    expect(calls[5].key).toBe(snapshotPrefix + "manifest.json");
    expect(calls[5].metadata.createOnly).toBe(true);
    expect(JSON.parse(calls[5].content)).toEqual(manifest);
    expect(calls.slice(6).map((call) => call.key)).toEqual(manifest.files.map((file) => file.key));
    expect(calls[6].key).toContain("_next/static/");
    expect(calls.slice(7).every((call) => call.metadata.cacheControl.includes("s-maxage=60"))).toBe(true);
    expect(calls.every((call) => /^(?:site|releases)\//.test(call.key))).toBe(true);
  }));

  it("refuses a changed export before any storage mutation", async () => fixture(async (root, manifest) => {
    await writeFile(join(root, "index.html"), "changed");
    const calls = [];
    await expect(uploadRelease({ manifest, exportDirectory: root,
      store: { async putObject(key) { calls.push(key); } } })).rejects.toThrow("changed");
    expect(calls).toEqual([]);
  }));

  it("validates the bucket before creating an AWS adapter", async () => {
    await expect(withAwsObjectStore("../wrong", async () => {})).rejects.toThrow("bucket");
  });
});
