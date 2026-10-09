import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ContentError, MAX_IMAGE_BYTES, mediaRepositoryPath } from "./model.js";
import { referencedImages } from "./references.js";
export { referencedImages } from "./references.js";

export async function gifPoster(bytes) {
  return sharp(bytes, { page: 0, failOn: "warning", limitInputPixels: 24_000_000 }).png().toBuffer();
}

export async function inspectImage(bytes, reference) {
  const repositoryPath = mediaRepositoryPath(reference);
  const fail = (message) => new ContentError([{ path: repositoryPath, message }]);
  if (bytes.length > MAX_IMAGE_BYTES) throw fail("Image exceeds the 5 MiB limit.");
  try {
    const gif = /\.gif$/.test(reference);
    const decoder = sharp(bytes, { failOn: "warning", animated: gif, limitInputPixels: 24_000_000 });
    const metadata = await decoder.metadata();
    const expected = path.extname(reference).slice(1).replace("jpg", "jpeg");
    if (!["png", "jpeg", "webp", "gif"].includes(metadata.format) || expected !== metadata.format) throw fail("Image bytes do not match an allowed file extension.");
    const frames = metadata.pages ?? 1;
    const frameHeight = metadata.pageHeight ?? metadata.height;
    if (gif) {
      if (!Number.isSafeInteger(frames) || frames < 1 || frames > 120) throw fail("GIF must have at most 120 frames.");
      if (!Number.isSafeInteger(frameHeight) || !Number.isSafeInteger(metadata.width) ||
          metadata.width * frameHeight * frames > 24_000_000) throw fail("GIF exceeds the decoded-pixel budget.");
    } else if (frames > 1) throw fail("Use a still PNG, JPEG or WebP image, not an animation.");
    // Decode the whole image, not only its header, so truncated/corrupt files fail.
    await decoder.clone().raw().toBuffer();
    const width = metadata.width;
    const height = gif ? frameHeight : metadata.height;
    const hash = createHash("sha256").update(bytes).digest("hex");
    const poster = gif ? await gifPoster(bytes) : null;
    const posterHash = poster ? createHash("sha256").update(poster).digest("hex") : null;
    return {
      repositoryPath, url: `/media/posts/${hash}.${metadata.format === "jpeg" ? "jpg" : metadata.format}`,
      hash, width, height, bytes: bytes.length, ...(gif ? { frames, posterHash, posterUrl: `/media/posts/${posterHash}.png` } : {}),
    };
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw fail("Invalid or corrupt image; upload a valid PNG, JPEG, WebP or bounded GIF below 5 MiB.");
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
