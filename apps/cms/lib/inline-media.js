import { isSlug, MAX_IMAGE_BYTES } from "@portfolio/blog-content/model";

const pendingPattern = /\/media\/__pending__\/([a-f0-9]{64}\.(?:png|jpg|webp|gif))/g;
const safeAssetName = /^[a-f0-9]{64}\.(?:png|jpg|webp|gif)$/;

export function imageExtension(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12 || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Use an image below 5 MiB.");
  }
  const starts = (...signature) => signature.every((byte, index) => bytes[index] === byte);
  if (starts(137, 80, 78, 71, 13, 10, 26, 10)) return "png";
  if (starts(255, 216, 255)) return "jpg";
  if (starts(82, 73, 70, 70) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  if (String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a") return "gif";
  throw new Error("Paste or select a PNG, JPEG, WebP or GIF image. SVG and remote links are not supported.");
}

export async function stageInlineImage(bytes, digest = (input) => globalThis.crypto.subtle.digest("SHA-256", input)) {
  const extension = imageExtension(bytes);
  const hashBytes = new Uint8Array(await digest(bytes));
  const hash = [...hashBytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Could not create a safe image reference.");
  const filename = `${hash}.${extension}`;
  return { filename, bytes, src: `/media/__pending__/${filename}` };
}

export function insertMarkdownImage(body, start, end, alt, src) {
  if (typeof body !== "string" || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end < start || end > body.length || !alt?.trim() || /[\r\n]/.test(alt) ||
      !/^\/media\/(?:__pending__|[a-z0-9]+(?:-[a-z0-9]+)*)\/[a-f0-9]{64}\.(?:png|jpg|webp|gif)$/.test(src)) {
    throw new Error("Add a short image description before inserting it into Markdown.");
  }
  const escapedAlt = alt.trim().replace(/[\\\[\]]/g, "\\$&");
  const insertion = `![${escapedAlt}](${src})`;
  return body.slice(0, start) + insertion + body.slice(end);
}

export function materializeInlineMedia(data, assets, slug) {
  const next = structuredClone(data);
  // Keystatic serializes browser-local drafts before the slug is complete.
  // The actual GitHub save supplies a validated slug and materializes paths.
  if (!isSlug(slug)) return next;
  const replace = (text) => typeof text === "string" ? text.replace(pendingPattern, (_match, filename) => {
    if (!assets.has(filename)) throw new Error(`Image ${filename} is not attached to this save.`);
    return `/media/${slug}/${filename}`;
  }) : text;
  for (const locale of ["pt", "en"]) if (next[locale]) next[locale].body = replace(next[locale].body);
  if (next.cover?.src) next.cover.src = replace(next.cover.src);
  if (Array.isArray(next.images)) next.images = next.images.map((image) => ({ ...image, src: replace(image.src) }));
  if ([next.pt?.body, next.en?.body, next.cover?.src, ...(next.images ?? []).map((image) => image.src)]
    .some((part) => typeof part === "string" && part.includes("/media/__pending__/"))) {
    throw new Error("An attached image has no valid local reference.");
  }
  return next;
}

export function reconcileInlineAssets(data, assets, slug) {
  const materialized = materializeInlineMedia(data, assets, slug);
  if (!isSlug(slug)) return { data: materialized, assets: new Map(assets) };
  const body = `${materialized.pt?.body ?? ""}\n${materialized.en?.body ?? ""}`;
  const used = (filename) => body.includes(`/media/${slug}/${filename}`) ||
    materialized.cover?.src === `/media/${slug}/${filename}`;
  const nextAssets = new Map(assets);
  for (const filename of nextAssets.keys()) if (safeAssetName.test(filename) && !used(filename)) nextAssets.delete(filename);
  if (Array.isArray(materialized.images)) {
    materialized.images = materialized.images.filter((image) => {
      const filename = image.src?.slice(`/media/${slug}/`.length);
      return !image.src?.startsWith(`/media/${slug}/`) || !safeAssetName.test(filename) || used(filename);
    });
  }
  return { data: materialized, assets: nextAssets };
}

export function safeAssetFilename(filename) {
  return safeAssetName.test(filename) || /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9._-]+\.(?:png|jpe?g|webp|gif)$/.test(filename) && !filename.includes("..");
}
