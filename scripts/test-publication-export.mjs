import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from "node:fs/promises";
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
  assert.match(await readFile(path.join(root, "out/pt/blog/index.html"), "utf8"), /Ainda não há artigos em português/);
  await assert.rejects(readFile(path.join(root, "out/pt/blog/__empty__/index.html"), "utf8"));
  assert.equal(JSON.parse(await readFile(path.join(root, "out/blog-search/en.json"), "utf8")).posts.length, 0);
  assert.equal(JSON.parse(await readFile(path.join(root, "out/blog-search/pt-BR.json"), "utf8")).posts.length, 0);
  assert.doesNotMatch(await readFile(path.join(root, "out/index.html"), "utf8"), /id="latest-title"/);
  assert.equal(((await readFile(path.join(root, "out/sitemap.xml"), "utf8")).match(/<url>/g) ?? []).length, 3);

  for (let index = 1; index <= 7; index += 1) {
    const slug = `fixture-post-${index}`;
    const record = validatePost({ title: `Fixture ${index}`, summary: "Public fixture summary", status: "published",
      publishedAt: `2026-09-${String(index).padStart(2, "0")}T12:00:00Z`, body: index === 1 ? "Unlisted bodyneedle term." : "Normal body text.",
      pt: { publish: true, title: `Artigo ${index}`, summary: "Resumo público", body: "Texto de criptografia." } }, slug);
    await writeFile(path.join(postsPath, `${slug}.yaml`), serializePost(record));
  }
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" });
  const englishSecondPage = await readFile(path.join(root, "out/blog/page/2/index.html"), "utf8");
  const portugueseSecondPage = await readFile(path.join(root, "out/pt/blog/page/2/index.html"), "utf8");
  assert.match(englishSecondPage, /Fixture 1/);
  assert.match(englishSecondPage, /https:\/\/lucas-reis.com\/blog\/page\/2\//);
  assert.doesNotMatch(englishSecondPage, /<link[^>]+hreflang="pt-BR"/i);
  assert.match(portugueseSecondPage, /Artigo 1/);
  assert.match(portugueseSecondPage, /https:\/\/lucas-reis.com\/pt\/blog\/page\/2\//);
  assert.doesNotMatch(portugueseSecondPage, /<link[^>]+hreflang="en"/i);
  assert.match(await readFile(path.join(root, "out/sitemap.xml"), "utf8"), /\/blog\/page\/2\//);
  assert.match(await readFile(path.join(root, "out/blog-search/en.json"), "utf8"), /bodyneedle/);
  await rm(path.join(postsPath, "fixture-post-1.yaml"));
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" });
  await assert.rejects(readFile(path.join(root, "out/blog/page/2/index.html"), "utf8"));
  await assert.rejects(readFile(path.join(root, "out/pt/blog/page/2/index.html"), "utf8"));
  for (let index = 2; index <= 7; index += 1) await rm(path.join(postsPath, `fixture-post-${index}.yaml`));

  await cp(path.join(root, "content"), path.join(fixture, "content"), { recursive: true });
  const marker = "DRAFT_EXPORT_CANARY__not_public__729acd679bf17__";
  for (const [slug, status, publishedAt] of [["private-draft", "draft", null], ["future-scheduled", "scheduled", "2099-01-01T00:00:00Z"]]) {
    const record = validatePost({ title: slug, summary: "Not eligible", status, publishedAt, body: `${marker}${slug}` }, slug);
    await writeFile(path.join(postsPath, `${slug}.yaml`), serializePost(record));
  }
  const translationMarker = "PORTUGUESE_DRAFT_CANARY__not_public__729acd679bf17__";
  const untranslated = validatePost({
    title: "English-only article", summary: "English summary", status: "published", publishedAt: "2026-09-18T12:00:00Z",
    body: "An English-only article.", pt: { publish: false, title: "Título ainda não publicado", body: translationMarker },
  }, "english-only");
  await writeFile(path.join(postsPath, "english-only.yaml"), serializePost(untranslated));
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z", KEYSTATIC_SECRET: "CMS_SECRET_CANARY__6f9e2ad701" });
  const enSearch = await readFile(path.join(root, "out/blog-search/en.json"), "utf8");
  const ptSearch = await readFile(path.join(root, "out/blog-search/pt-BR.json"), "utf8");
  assert.doesNotMatch(enSearch + ptSearch, /DRAFT_EXPORT_CANARY|PORTUGUESE_DRAFT_CANARY|private-draft|future-scheduled/);
  assert.match(enSearch, /english-only/);
  assert.doesNotMatch(ptSearch, /english-only/);
  await assert.rejects(readFile(path.join(root, "out/pt/blog/english-only/index.html"), "utf8"));
  const withoutTranslation = await readFile(path.join(root, "out/pt/blog/index.html"), "utf8");
  assert.doesNotMatch(withoutTranslation, /Título ainda não publicado/);

  const bilingual = validatePost({
    title: "English article", summary: "English summary", status: "published", publishedAt: "2026-09-19T12:00:00Z",
    body: "An English article about application security.",
    images: [{ src: "/media/markdown-demo/ufabc.png", alt: "UFABC mark" }],
    pt: { publish: true, title: "Artigo em português", summary: "Resumo do artigo", body: "## Segurança de aplicações\n\n![Marca da UFABC](/media/markdown-demo/ufabc.png)" },
  }, "bilingual-demo");
  await writeFile(path.join(postsPath, "bilingual-demo.yaml"), serializePost(bilingual));
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" });
  const portugueseHtml = await readFile(path.join(root, "out/pt/blog/bilingual-demo/index.html"), "utf8");
  assert.match(portugueseHtml, /<html lang="pt-BR"/);
  assert.match(portugueseHtml, /Artigo em português/);
  assert.match(portugueseHtml, /Marca da UFABC/);
  assert.match(portugueseHtml, /hrefLang="en"/);
  assert.match(portugueseHtml, /hrefLang="pt-BR"/);
  const englishHtml = await readFile(path.join(root, "out/blog/bilingual-demo/index.html"), "utf8");
  assert.match(englishHtml, /English article/);
  assert.doesNotMatch(englishHtml, /Segurança de aplicações/);
  const sitemap = await readFile(path.join(root, "out/sitemap.xml"), "utf8");
  assert.match(sitemap, /\/pt\/blog\/bilingual-demo\//);
  assert.doesNotMatch(sitemap, /\/pt\/blog\/english-only\//);

  await writeFile(path.join(postsPath, "bilingual-demo.yaml"), serializePost({ ...bilingual, pt: { ...bilingual.pt, publish: false } }));
  runBuild({ BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" });
  await assert.rejects(readFile(path.join(root, "out/pt/blog/bilingual-demo/index.html"), "utf8"));
  assert.match(await readFile(path.join(root, "out/blog/bilingual-demo/index.html"), "utf8"), /English article/);

  const invalid = { ...bilingual, pt: { ...bilingual.pt, publish: true, summary: "" } };
  await writeFile(path.join(postsPath, "bilingual-demo.yaml"), serializePost({ ...invalid, pt: { ...invalid.pt, publish: false } }));
  const invalidRecord = (await readFile(path.join(postsPath, "bilingual-demo.yaml"), "utf8")).replace("publish: false", "publish: true");
  await writeFile(path.join(postsPath, "bilingual-demo.yaml"), invalidRecord);
  const rejected = spawnSync(process.execPath, ["scripts/build-site.mjs"], { cwd: root, encoding: "utf8", env: { ...process.env, BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: "2026-09-27T18:00:00Z" } });
  assert.notEqual(rejected.status, 0);
  assert.match(`${rejected.stdout}${rejected.stderr}`, /pt.summary/);
  // The production audit scans every HTML, RSC, JS and discovery artifact in this build.
  console.info("Empty, draft, future, bilingual, withdrawal and invalid translation exports passed.");
} finally {
  // Leave the normal export ready for browser tests; never mutate real editorial records.
  runBuild({ BLOG_CONTENT_ROOT: root, BLOG_PUBLICATION_TIME: process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString() });
  console.info(`Fixture retained for inspection: ${fixture}`);
}
