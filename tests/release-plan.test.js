import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReleaseManifest, classifySiteFile, validateReleaseId,
  validateSitePath, assertReleaseManifest } from "../scripts/release-plan.mjs";

const sha = "a".repeat(40);
const releaseId = `${sha}-123-1`;

async function fixture(callback) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-blog-release-test-"));
  try {
    await writeFile(join(root, "index.html"), "home");
    await writeFile(join(root, "404.html"), "missing");
    await mkdir(join(root, "blog-search"));
    for (const locale of ["en", "pt-BR"]) {
      await writeFile(join(root, `blog-search/${locale}.json`), JSON.stringify({ schema: 1, locale, posts: [], terms: {} }));
    }
    await mkdir(join(root, "_next/static"), { recursive: true });
    await writeFile(join(root, "_next/static/bundle-123.js"), "console.log(1)");
    await mkdir(join(root, "blog/example"), { recursive: true });
    await writeFile(join(root, "blog/example/index.html"), "article");
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("release plan", () => {
  it("plans only site keys and uploads immutable assets before mutable documents", async () => fixture(async (root) => {
    const manifest = await buildReleaseManifest({ exportDirectory: root, sourceRevision: sha,
      publicationTime: "2026-09-28T00:00:00.000Z", releaseId, posts: ["example"] });
    expect(assertReleaseManifest(manifest)).toBe(manifest);
    expect(manifest.files[0].key).toBe("site/_next/static/bundle-123.js");
    expect(manifest.files[0].cacheControl).toContain("immutable");
    expect(manifest.files.at(-1).cacheControl).toContain("s-maxage=60");
    expect(manifest.mutableKeys).toEqual(["site/404.html", "site/blog-search/en.json", "site/blog-search/pt-BR.json", "site/blog/example/index.html", "site/index.html"]);
    expect(manifest.files.every((file) => file.key.startsWith("site/"))).toBe(true);
    expect(manifest.files.find((file) => file.path === "index.html").contentType).toContain("text/html");
  }));

  it("rejects out-of-scope paths, spoofed manifests and symlinks", async () => {
    for (const relative of ["../secret", "/absolute", "site//file.js", "preview/index.html",
      "state/current.json", "content/posts/a.yaml", "article%2fsecret.html", "a\\b.js", "bad.bin"]) {
      expect(() => validateSitePath(relative)).toThrow();
    }
    expect(() => validateReleaseId("../../bad")).toThrow();
    expect(classifySiteFile("media/posts/" + "b".repeat(64) + ".png").immutable).toBe(true);
    expect(classifySiteFile("brands/ufabc.png").immutable).toBe(false);
    await fixture(async (root) => {
      const manifest = await buildReleaseManifest({ exportDirectory: root, sourceRevision: sha,
        publicationTime: "2026-09-28T00:00:00.000Z", releaseId, posts: [] });
      expect(() => assertReleaseManifest({ ...manifest, files: [{ ...manifest.files[0], key: "state/other" },
        ...manifest.files.slice(1)] })).toThrow();
      await symlink(join(root, "index.html"), join(root, "linked.html"));
      await expect(buildReleaseManifest({ exportDirectory: root, sourceRevision: sha,
        publicationTime: "2026-09-28T00:00:00.000Z", releaseId, posts: [] })).rejects.toThrow("Symlink");
    });
  });
  it("tracks Portuguese routes without breaking older release manifests", async () => fixture(async (root) => {
    await mkdir(join(root, "pt/blog/example"), { recursive: true });
    await writeFile(join(root, "pt/blog/index.html"), "Portuguese index");
    await writeFile(join(root, "pt/blog/example/index.html"), "Portuguese article");
    const manifest = await buildReleaseManifest({ exportDirectory: root, sourceRevision: sha,
      publicationTime: "2026-09-28T00:00:00.000Z", releaseId, posts: ["example"], portuguesePosts: ["example"] });
    expect(manifest.portuguesePosts).toEqual(["example"]);
    expect(assertReleaseManifest(manifest)).toBe(manifest);
    expect(assertReleaseManifest({ ...manifest, portuguesePosts: undefined })).toBeTruthy();
    expect(() => assertReleaseManifest({ ...manifest, portuguesePosts: ["missing"] })).toThrow(/article lists/);
    await expect(buildReleaseManifest({ exportDirectory: root, sourceRevision: sha,
      publicationTime: "2026-09-28T00:00:00.000Z", releaseId, posts: ["example"], portuguesePosts: ["missing"] })).rejects.toThrow(/Portuguese post list/);
  }));
  it("rejects missing search data", async () => fixture(async (root) => {
    await rm(join(root, "blog-search/en.json"));
    await expect(buildReleaseManifest({ exportDirectory: root, sourceRevision: sha,
      publicationTime: "2026-09-28T00:00:00.000Z", releaseId, posts: [] })).rejects.toThrow(/Missing public search index/);
  }));
});
