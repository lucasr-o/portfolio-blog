import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializePost, validatePost } from "@portfolio/blog-content/model";
import { buildReleaseManifest } from "./release-plan.mjs";
import { inspectImage } from "@portfolio/blog-content/media";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), "portfolio-localized-export-"));
const records = path.join(fixture, "content/posts");
const cutoff = "2026-10-20T12:00:00.000Z";

function build(contentRoot) {
  const result = spawnSync(process.execPath, ["scripts/build-site.mjs"], {
    cwd: root, stdio: "inherit", env: { ...process.env, BLOG_CONTENT_ROOT: contentRoot, BLOG_PUBLICATION_TIME: cutoff },
  });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`Static export failed (${result.status})`);
}

try {
  await mkdir(records, { recursive: true });
  const ptOnly = validatePost({
    title: "Artigo apenas em português",
    editorial: {
      titleLocale: "pt", status: "published", createdAt: "2026-10-01T12:00:00Z",
      pt: { publish: true, summary: "Resumo exclusivo", body: "## Corpo português\n\nTexto.", publishedAt: "2026-10-01T12:00:00Z" },
    },
  }, "portuguese-only");
  const bilingual = validatePost({
    title: "Artigo traduzido",
    editorial: {
      titleLocale: "pt", status: "published", createdAt: "2026-10-01T12:00:00Z",
      pt: { publish: true, summary: "Resumo português", body: "Corpo português.", publishedAt: "2026-10-01T12:00:00Z" },
      en: { publish: true, title: "Article translated later", summary: "English summary", body: "English body.", publishedAt: "2026-10-15T12:00:00Z" },
    },
  }, "translated-later");
  await writeFile(path.join(records, "portuguese-only.yaml"), serializePost(ptOnly));
  await writeFile(path.join(records, "translated-later.yaml"), serializePost(bilingual));
  build(fixture);

  const read = (relative) => readFile(path.join(root, "out", relative), "utf8");
  assert.match(await read("pt/blog/portuguese-only/index.html"), /Artigo apenas em português/);
  await assert.rejects(read("blog/portuguese-only/index.html"));
  assert.match(await read("blog/translated-later/index.html"), /Article translated later/);
  assert.match(await read("pt/blog/translated-later/index.html"), /Artigo traduzido/);
  const home = await read("index.html");
  assert.match(home, /Article translated later/);
  assert.doesNotMatch(home, /Artigo apenas em português|Resumo português/);
  const englishIndex = await read("blog/index.html");
  assert.doesNotMatch(englishIndex, /Artigo apenas em português/);
  assert.match(await read("pt/blog/index.html"), /Artigo apenas em português/);
  const englishSearch = JSON.parse(await read("blog-search/en.json"));
  const portugueseSearch = JSON.parse(await read("blog-search/pt-BR.json"));
  assert.deepEqual(englishSearch.posts.map((post) => post.slug), ["translated-later"]);
  assert.deepEqual(portugueseSearch.posts.map((post) => post.slug), ["portuguese-only", "translated-later"]);
  const sitemap = await read("sitemap.xml");
  assert.match(sitemap, /\/pt\/blog\/portuguese-only\//);
  assert.doesNotMatch(sitemap, /lucas-reis.com\/blog\/portuguese-only\//);

  const revision = "a".repeat(40);
  const manifest = await buildReleaseManifest({ exportDirectory: path.join(root, "out"),
    sourceRevision: revision, releaseId: `${revision}-1-1`, publicationTime: cutoff,
    posts: ["translated-later"], portuguesePosts: ["portuguese-only", "translated-later"] });
  assert.deepEqual(manifest.portuguesePosts, ["portuguese-only", "translated-later"]);
  const gifSource = "/media/gif-demo/loop.gif";
  const gifBytes = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
  await mkdir(path.join(fixture, "content/media/gif-demo"), { recursive: true });
  await writeFile(path.join(fixture, "content/media/gif-demo/loop.gif"), gifBytes);
  const gifPost = validatePost({ title: "Post com GIF", editorial: {
    titleLocale: "pt", status: "published", createdAt: "2026-10-16T12:00:00Z",
    images: [{ src: gifSource }],
    pt: { publish: true, summary: "Um GIF curto", body: `![Animação curta](${gifSource})`, publishedAt: "2026-10-16T12:00:00Z" },
  } }, "gif-demo");
  await writeFile(path.join(records, "gif-demo.yaml"), serializePost(gifPost));
  build(fixture);
  const gifAsset = await inspectImage(gifBytes, gifSource);
  assert.deepEqual(await readFile(path.join(root, "out", gifAsset.url.slice(1))), gifBytes);
  assert.ok((await readFile(path.join(root, "out", gifAsset.posterUrl.slice(1)))).length > 0);
  assert.match(await read("pt/blog/gif-demo/index.html"), /Reproduzir animação/);
  const gifManifest = await buildReleaseManifest({ exportDirectory: path.join(root, "out"),
    sourceRevision: revision, releaseId: `${revision}-2-1`, publicationTime: cutoff,
    posts: ["translated-later"], portuguesePosts: ["gif-demo", "portuguese-only", "translated-later"] });
  assert.equal(gifManifest.files.find((file) => file.path === gifAsset.url.slice(1)).contentType, "image/gif");
  assert.equal(gifManifest.files.find((file) => file.path === gifAsset.posterUrl.slice(1)).contentType, "image/png");
  console.info("Localized static export, search, sitemap and release manifest passed.");
} finally {
  await rm(fixture, { recursive: true, force: true });
  build(root);
}
