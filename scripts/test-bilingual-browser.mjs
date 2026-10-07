import { spawnSync } from "node:child_process";
import { mkdtemp, cp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { serializePost, validatePost } from "@portfolio/blog-content/model";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), "portfolio-bilingual-browser-"));
const run = (args, env = {}) => {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`${args[0]} failed (${result.status})`);
};

try {
  await cp(path.join(root, "content"), path.join(fixture, "content"), { recursive: true });
  await mkdir(path.join(fixture, "content/posts"), { recursive: true });
  const bilingual = validatePost({
    title: "English article", summary: "English summary", status: "published", publishedAt: "2026-09-19T12:00:00Z",
    body: "An English article about application security.",
    images: [{ src: "/media/markdown-demo/ufabc.png", alt: "UFABC mark" }],
    pt: { publish: true, title: "Artigo em português", summary: "Resumo do artigo", body: "## Segurança de aplicações\n\n![Marca da UFABC](/media/markdown-demo/ufabc.png)" },
  }, "bilingual-demo");
  const englishOnly = validatePost({ title: "English-only article", summary: "English summary", body: "Only English.", status: "published", publishedAt: "2026-09-18T12:00:00Z" }, "english-only");
  await writeFile(path.join(fixture, "content/posts/bilingual-demo.yaml"), serializePost(bilingual));
  await writeFile(path.join(fixture, "content/posts/english-only.yaml"), serializePost(englishOnly));
  run(["scripts/build-site.mjs"], { BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" });
  run(["node_modules/@playwright/test/cli.js", "test", "e2e/bilingual.spec.js", "--config", "playwright.config.js"], { BLOG_TEST_BILINGUAL: "1" });
} finally {
  run(["scripts/build-site.mjs"], { BLOG_CONTENT_ROOT: root, BLOG_PUBLICATION_TIME: process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString() });
  await rm(fixture, { recursive: true, force: true });
}
