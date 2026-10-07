import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { ContentError, MAX_IMAGE_BYTES, mediaRepositoryPath } from "./model.js";

export function referencedImages(post) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(post.body);
  const definitions = new Map();
  visit(tree, "definition", (node) => definitions.set(node.identifier.toLowerCase(), node.url));
  const refs = [];
  if (post.cover) refs.push(post.cover);
  visit(tree, (node) => {
    if (node.type === "image") refs.push({ src: node.url, alt: node.alt });
    if (node.type === "imageReference") refs.push({ src: definitions.get(node.identifier.toLowerCase()), alt: node.alt });
  });
  const declared = new Map([...(post.cover ? [post.cover] : []), ...post.images].map((image) => [image.src, image]));
  for (const reference of refs) {
    const field = `${post.slug}:${post.locale === "pt-BR" ? "pt.body" : "body"}.image`;
    try { mediaRepositoryPath(reference.src); } catch (error) { throw new ContentError([{ path: field, message: error.message }]); }
    if (!reference.alt?.trim()) throw new ContentError([{ path: field, message: `Add descriptive alt text for ${reference.src}.` }]);
    if (!declared.has(reference.src)) throw new ContentError([{ path: field, message: `Add ${reference.src} to the Images field before using it in Markdown.` }]);
  }
  return refs;
}

export async function inspectImage(bytes, reference) {
  const repositoryPath = mediaRepositoryPath(reference);
  const fail = (message) => new ContentError([{ path: repositoryPath, message }]);
  if (bytes.length > MAX_IMAGE_BYTES) throw fail("Image exceeds the 5 MiB limit.");
  try {
    const decoder = sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 });
    const metadata = await decoder.metadata();
    const expected = path.extname(reference).slice(1).replace("jpg", "jpeg");
    if (!["png", "jpeg", "webp"].includes(metadata.format) || expected !== metadata.format) throw fail("Image bytes do not match an allowed file extension.");
    if (metadata.pages > 1) throw fail("Use a still PNG, JPEG or WebP image, not an animation.");
    // Decode the whole image, not only its header, so truncated/corrupt files fail.
    await decoder.clone().raw().toBuffer();
    const { width, height } = metadata.autoOrient ?? metadata;
    const hash = createHash("sha256").update(bytes).digest("hex");
    return { repositoryPath, url: `/media/posts/${hash}.${metadata.format === "jpeg" ? "jpg" : metadata.format}`, hash, width, height, bytes: bytes.length };
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw fail("Invalid or corrupt image; upload a valid PNG, JPEG or WebP below 5 MiB and 40 megapixels.");
  }
}

export function localMediaReader(workspaceRoot) {
  return async (repositoryPath) => {
    const file = path.resolve(workspaceRoot, repositoryPath);
    const mediaRoot = path.resolve(workspaceRoot, "content/media");
    const actual = await realpath(file);
    if (!actual.startsWith(`${mediaRoot}${path.sep}`) || actual !== file) throw new ContentError([{ path: repositoryPath, message: "Image path must be inside content/media without symlinks." }]);
    if ((await stat(actual)).size > MAX_IMAGE_BYTES) throw new ContentError([{ path: repositoryPath, message: "Image exceeds the 5 MiB limit." }]);
    return readFile(actual);
  };
}

export async function createMediaManifest(posts, readMedia) {
  const manifest = {};
  for (const post of posts) {
    for (const reference of referencedImages(post)) {
      if (manifest[reference.src]) continue;
      const repositoryPath = mediaRepositoryPath(reference.src);
      let bytes;
      try { bytes = await readMedia(repositoryPath); } catch (error) {
        if (error instanceof ContentError) throw error;
        throw new ContentError([{ path: `${post.slug}:${repositoryPath}`, message: "Cannot read the referenced image." }]);
      }
      manifest[reference.src] = { ...await inspectImage(bytes, reference.src), alt: reference.alt };
    }
  }
  return manifest;
}
