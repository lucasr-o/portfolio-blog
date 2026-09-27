import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { readPosts } from "@portfolio/blog-content/reader";

export async function auditPublication({ root, contentRoot = root, publication }) {
  const output = path.join(root, "out");
  const allPosts = await readPosts(contentRoot);
  const allowed = new Set(publication.posts.map((post) => post.slug));
  const excluded = allPosts.filter((post) => !allowed.has(post.slug));
  const allowedMedia = new Set(Object.values(publication.media).map((image) => image.url.slice(1)));
  const forbidden = ["@keystatic/", "KEYSTATIC_GITHUB_CLIENT_SECRET", "KEYSTATIC_SECRET", "CLOUDFLARE_TUNNEL_TOKEN", "keystatic-gh-access-token", "https://lucas-reis.dev"];
  for (const key of ["KEYSTATIC_SECRET", "KEYSTATIC_GITHUB_CLIENT_SECRET", "CLOUDFLARE_TUNNEL_TOKEN", "AWS_SECRET_ACCESS_KEY"]) {
    if (process.env[key]?.length > 12) forbidden.push(process.env[key]);
  }
  const files = await readdir(output, { recursive: true, withFileTypes: true });
  for (const entry of files) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name);
    const relative = path.relative(output, file).split(path.sep).join("/");
    if (relative.includes("__empty__")) throw new Error(`Build-only not-found route leaked into export: ${relative}`);
    if (/\.(ya?ml|md|mdoc|mdx|env)$/.test(relative) || /(?:^|\/)(?:keystatic|content|preview)(?:\/|$)/.test(relative)) throw new Error(`Private/editorial artifact in export: ${relative}`);
    if (relative.startsWith("media/") && !allowedMedia.has(relative)) throw new Error(`Unreferenced media in export: ${relative}`);
    for (const post of excluded) {
      if (relative.startsWith(`blog/${post.slug}/`) || relative === `blog/${post.slug}.html`) throw new Error(`Excluded article route: ${relative}`);
    }
    if (!/\.(?:html|txt|js|json|xml|css)$/.test(relative)) continue;
    const text = await readFile(file, "utf8");
    for (const marker of forbidden) if (text.includes(marker)) throw new Error(`Forbidden CMS/secret/canonical marker in ${relative}`);
    for (const post of excluded) {
      // Check source, JSON-escaped source and distinctive paragraph strings in RSC/HTML.
      const pieces = [post.body, ...post.body.split(/\n\s*\n/)].filter((piece) => piece.length >= 40);
      for (const piece of pieces) {
        if (text.includes(piece) || text.includes(JSON.stringify(piece).slice(1, -1))) throw new Error(`Excluded article body in ${relative}: ${post.slug}`);
      }
    }
  }
  for (const media of allowedMedia) await stat(path.join(output, media));
  const sitemap = await readFile(path.join(output, "sitemap.xml"), "utf8");
  for (const post of excluded) if (sitemap.includes(`/blog/${post.slug}/`)) throw new Error(`Excluded article in sitemap: ${post.slug}`);
  console.info(`Publication audit: ${allowed.size} eligible articles; ${excluded.length} excluded; ${allowedMedia.size} images.`);
}
