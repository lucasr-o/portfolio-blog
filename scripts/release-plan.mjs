import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const IMMUTABLE = "public, max-age=31536000, immutable";
const MUTABLE = "public, max-age=0, s-maxage=60, must-revalidate";
const FILE_SEGMENT = /^[A-Za-z0-9._~!$&'()+,;=@-]+$/;
const SHA = /^[a-f0-9]{40}$/;
const RELEASE_ID = /^[a-f0-9]{40}-[0-9]{1,20}-[1-9][0-9]*$/;

export function validateReleaseId(value) {
  if (!RELEASE_ID.test(value ?? "")) throw new Error("Invalid release ID");
  return value;
}

export function validateSitePath(relative) {
  if (typeof relative !== "string" || relative.length === 0 || relative.length > 2048 ||
      relative.includes("\\") || relative.includes("%") || relative.includes("//")) {
    throw new Error(`Unsafe export path: ${relative}`);
  }
  const parts = relative.split("/");
  if (parts.some((part) => !FILE_SEGMENT.test(part) || part === "." || part === "..")) {
    throw new Error(`Unsafe export path: ${relative}`);
  }
  if (/^(state|releases|keystatic|api|preview|content|apps)(?:\/|$)/.test(relative)) {
    throw new Error(`Administrative export path: ${relative}`);
  }
  const extension = path.posix.extname(relative);
  if (!CONTENT_TYPES[extension]) throw new Error(`Unsupported export format: ${relative}`);
  return relative;
}

export function classifySiteFile(relative) {
  validateSitePath(relative);
  const immutable = relative.startsWith("_next/static/") ||
    /^media\/posts\/[a-f0-9]{64}\.(?:png|jpg|jpeg|webp)$/.test(relative);
  return {
    contentType: CONTENT_TYPES[path.posix.extname(relative)],
    cacheControl: immutable ? IMMUTABLE : MUTABLE,
    immutable,
  };
}

async function listFiles(directory, prefix = "") {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in export: ${relative}`);
    if (entry.isDirectory()) output.push(...await listFiles(absolute, `${relative}/`));
    else if (entry.isFile()) output.push(relative);
    else throw new Error(`Non-file in export: ${relative}`);
  }
  return output;
}

export async function buildReleaseManifest({ exportDirectory, sourceRevision, publicationTime,
  releaseId, posts }) {
  if (!SHA.test(sourceRevision ?? "")) throw new Error("Invalid source revision");
  validateReleaseId(releaseId);
  if (!Number.isFinite(Date.parse(publicationTime)) || new Date(publicationTime).toISOString() !== publicationTime) {
    throw new Error("Invalid UTC publication cutoff");
  }
  if (!Array.isArray(posts) || posts.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    throw new Error("Invalid published post list");
  }
  const relativeFiles = await listFiles(exportDirectory);
  if (!relativeFiles.includes("index.html") || !relativeFiles.includes("404.html")) {
    throw new Error("Incomplete export: home or 404 missing");
  }
  const files = [];
  for (const relative of relativeFiles) {
    const metadata = classifySiteFile(relative);
    const data = await readFile(path.join(exportDirectory, relative));
    files.push({ path: relative, key: `site/${relative}`,
      sha256: createHash("sha256").update(data).digest("hex"), bytes: data.length,
      ...metadata });
  }
  files.sort((left, right) => Number(right.immutable) - Number(left.immutable) ||
    left.path.localeCompare(right.path, "en"));
  return {
    schema: 1, releaseId, sourceRevision, publicationTime,
    posts: [...posts].sort(), files,
    mutableKeys: files.filter((file) => !file.immutable).map((file) => file.key).sort(),
  };
}

export function assertReleaseManifest(manifest) {
  if (manifest?.schema !== 1 || !SHA.test(manifest.sourceRevision ?? "") ||
      !Number.isFinite(Date.parse(manifest.publicationTime)) ||
      !Array.isArray(manifest.files) || !Array.isArray(manifest.mutableKeys)) {
    throw new Error("Invalid release manifest");
  }
  validateReleaseId(manifest.releaseId);
  const keys = new Set();
  for (const file of manifest.files) {
    const metadata = classifySiteFile(file.path);
    if (file.key !== `site/${file.path}` || keys.has(file.key) ||
        !/^[a-f0-9]{64}$/.test(file.sha256) ||
        !Number.isSafeInteger(file.bytes) || file.bytes < 0 ||
        file.immutable !== metadata.immutable ||
        file.cacheControl !== metadata.cacheControl ||
        file.contentType !== metadata.contentType) throw new Error("Invalid release file");
    keys.add(file.key);
  }
  const expectedMutable = manifest.files.filter((file) => !file.immutable).map((file) => file.key).sort();
  if (JSON.stringify([...manifest.mutableKeys].sort()) !== JSON.stringify(expectedMutable)) {
    throw new Error("Invalid mutable key list");
  }
  return manifest;
}
