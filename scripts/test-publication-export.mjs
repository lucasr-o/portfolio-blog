import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializePost, validatePost } from "@portfolio/blog-content/model";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), "portfolio-publication-"));
const postsPath = path.join(fixture, "content/posts");
await mkdir(postsPath, { recursive: true });
const runBuild = (extraEnv = {}) => {
  const result = spawnSync(process.execPath, ["scripts/build-site.mjs"], {
    cwd: root, stdio: "inherit", env: { ...process.env, ...extraEnv },
  });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`Export failed (${result.status})`);
};
try {
  // Build a genuinely empty collection; the build-only not-found parameter must emit no files.
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" });
  assert.match(await readFile(path.join(root, "out/blog/index.html"), "utf8"), /No articles yet/);
  assert.doesNotMatch(await readFile(path.join(root, "out/index.html"), "utf8"), /id="latest-title"/);
  assert.equal(((await readFile(path.join(root, "out/sitemap.xml"), "utf8")).match(/<url>/g) ?? []).length, 2);

  await cp(path.join(root, "content"), path.join(fixture, "content"), { recursive: true });
  const marker = "DRAFT_EXPORT_CANARY__not_public__729acd679bf17__";
  for (const [slug, status, publishedAt] of [["private-draft", "draft", null], ["future-scheduled", "scheduled", "2099-01-01T00:00:00Z"]]) {
    const record = validatePost({ title: slug, summary: "Not eligible", status, publishedAt, body: `${marker}${slug}` }, slug);
    await writeFile(path.join(postsPath, `${slug}.yaml`), serializePost(record));
  }
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z", KEYSTATIC_SECRET: "CMS_SECRET_CANARY__6f9e2ad701" });
  // The production audit scans every HTML, RSC, JS and discovery artifact in this build.
  console.info("Empty, draft and future article exports passed.");
} finally {
  // Leave the normal export ready for browser tests; never mutate real editorial records.
  runBuild({ BLOG_CONTENT_ROOT: root, BLOG_PUBLICATION_TIME: process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString() });
  console.info(`Fixture retained for inspection: ${fixture}`);
}
