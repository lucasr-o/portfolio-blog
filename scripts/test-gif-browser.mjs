import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializePost, validatePost } from "@portfolio/blog-content/model";
import { inspectImage } from "@portfolio/blog-content/media";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireBlog = createRequire(new URL("../packages/blog-content/package.json", import.meta.url));
const sharp = requireBlog("sharp");
const fixture = await mkdtemp(path.join(tmpdir(), "portfolio-gif-browser-"));
const cutoff = "2026-10-20T12:00:00.000Z";
const width = 640;
const height = 360;
const frames = 12;
const run = (args, extraEnv = {}) => {
  const result = spawnSync(process.execPath, args, {
    cwd: root, stdio: "inherit", env: { ...process.env, ...extraEnv },
  });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`${args[0]} exited with ${result.status}`);
};

try {
  const pixels = Buffer.alloc(width * height * frames * 4);
  for (let frame = 0; frame < frames; frame += 1) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = (frame * width * height + y * width + x) * 4;
        const highlight = Math.abs(x - (50 + frame * 40)) < 30 && Math.abs(y - 180) < 30;
        pixels[at] = highlight ? 74 : Math.floor(x / 8);
        pixels[at + 1] = highlight ? 132 : Math.floor(y / 5);
        pixels[at + 2] = highlight ? 213 : 58;
        pixels[at + 3] = 255;
      }
    }
  }
  const gif = await sharp(pixels, { raw: { width, height: height * frames, pageHeight: height, channels: 4 } })
    .gif({ colours: 64, dither: 0, delay: 80, loop: 0 }).toBuffer();
  const source = "/media/gif-demo/animation.gif";
  const asset = await inspectImage(gif, source);
  if (asset.frames !== frames || asset.width !== width || asset.height !== height) throw new Error("GIF fixture dimensions or frames are wrong.");
  await mkdir(path.join(fixture, "content/posts"), { recursive: true });
  await mkdir(path.join(fixture, "content/media/gif-demo"), { recursive: true });
  await writeFile(path.join(fixture, "content/media/gif-demo/animation.gif"), gif);
  const record = validatePost({ title: "GIF de teste", editorial: {
    titleLocale: "pt", status: "published", createdAt: "2026-10-16T12:00:00Z",
    images: [{ src: source }],
    pt: { publish: true, summary: "Animação de teste", body: `## Demonstração\n\n![Animação de teste](${source})`, publishedAt: "2026-10-16T12:00:00Z" },
  } }, "gif-demo");
  await writeFile(path.join(fixture, "content/posts/gif-demo.yaml"), serializePost(record));
  run(["scripts/build-site.mjs"], { BLOG_CONTENT_ROOT: fixture, BLOG_PUBLICATION_TIME: cutoff });
  const poster = await readFile(path.join(root, "out", asset.posterUrl.slice(1)));
  if (poster.length > 512 * 1024) throw new Error(`Representative GIF poster exceeds 512 KiB: ${poster.length}`);
  run(["node_modules/@playwright/test/cli.js", "test", "e2e/gif.spec.js", "--config", "playwright.config.js"], {
    BLOG_TEST_GIF: "1", BLOG_TEST_GIF_BYTES: String(gif.length), BLOG_TEST_GIF_POSTER_BYTES: String(poster.length),
  });
  console.info(`Mobile GIF fixture: ${width}×${height}, ${frames} frames, GIF ${gif.length} B on explicit play, poster ${poster.length} B initially.`);
} finally {
  run(["scripts/build-site.mjs"], { BLOG_CONTENT_ROOT: root, BLOG_PUBLICATION_TIME: process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString() });
  await rm(fixture, { recursive: true, force: true });
}
