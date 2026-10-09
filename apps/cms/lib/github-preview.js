import { ContentError, isSlug, MAX_IMAGE_BYTES, mediaRepositoryPath, parsePostYaml, validatePost } from "@portfolio/blog-content/model";
import { gifPoster, inspectImage, referencedImages } from "@portfolio/blog-content/media";
import { ENGLISH, PORTUGUESE, projectPost } from "@portfolio/blog-content/locale";

export const REPOSITORY = "lucasr-o/portfolio-blog";
export const REVISION_PATTERN = /^[a-f0-9]{40}$/;
export const PREVIEW_HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" };
export class PreviewError extends Error {
  constructor(message, status = 502) { super(message); this.name = "PreviewError"; this.status = status; }
}

// Never accept an API origin, repository, branch or arbitrary path from a request.
export async function openGitHubSnapshot(token, { revision, fetcher = fetch } = {}) {
  if (!token || /[\r\n]/.test(token)) throw new PreviewError("Sign in to Keystatic with GitHub, then reopen the preview.", 401);
  if (revision !== undefined && !REVISION_PATTERN.test(revision)) throw new PreviewError("Invalid saved revision.", 400);
  async function request(endpoint, maxBytes = 8 * 1024 * 1024) {
    let response;
    try {
      response = await fetcher(`https://api.github.com${endpoint}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10" },
        cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
      });
    } catch { throw new PreviewError("GitHub is unavailable. Your saved posts have not been changed; retry shortly."); }
    if ([401, 403].includes(response.status)) throw new PreviewError("GitHub access expired or was denied. Sign in again; if it persists, check repository access and rate limits.", 401);
    if (response.status === 404) throw new PreviewError("The saved content was not found in portfolio-blog.", 404);
    if (!response.ok) throw new PreviewError("GitHub could not load this saved revision. Retry shortly.");
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) { await reader.cancel(); throw new PreviewError("The GitHub response exceeds the preview size limit.", 422); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new PreviewError("GitHub returned an invalid response. Retry shortly."); }
  }
  const user = await request("/user");
  if (user.login !== "lucasr-o") throw new PreviewError("Only the portfolio owner can access saved previews.", 403);
  const repository = await request(`/repos/${REPOSITORY}`);
  if (repository.full_name !== REPOSITORY || repository.permissions?.push !== true) throw new PreviewError("Write access to portfolio-blog is required for previews.", 403);
  const commit = await request(`/repos/${REPOSITORY}/commits/${revision || "main"}`);
  if (!REVISION_PATTERN.test(commit.sha) || !REVISION_PATTERN.test(commit.commit?.tree?.sha)) throw new PreviewError("GitHub returned an invalid saved revision.");
  const tree = await request(`/repos/${REPOSITORY}/git/trees/${commit.commit.tree.sha}?recursive=1`);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new PreviewError("The repository tree cannot be loaded completely. No partial preview is shown.", 422);
  const entries = new Map(tree.tree.map((entry) => [entry.path, entry]));
  async function readBlob(repositoryPath, limit) {
    const entry = entries.get(repositoryPath);
    if (!entry) throw new PreviewError("The saved article or image was not found.", 404);
    if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode) || !REVISION_PATTERN.test(entry.sha)) throw new PreviewError("Editorial files must be regular Git files, not links or submodules.", 422);
    if (!Number.isInteger(entry.size) || entry.size > limit) throw new PreviewError("Saved file exceeds the size limit (1 MiB per article, 5 MiB per image).", 422);
    const blob = await request(`/repos/${REPOSITORY}/git/blobs/${entry.sha}`, Math.ceil(limit * 1.5) + 16384);
    if (blob.encoding !== "base64" || typeof blob.content !== "string") throw new PreviewError("GitHub returned an invalid file encoding.");
    const bytes = Buffer.from(blob.content, "base64");
    if (bytes.length !== entry.size || bytes.length > limit) throw new PreviewError("Saved file size does not match its Git record.", 422);
    return bytes;
  }
  return {
    revision: commit.sha,
    slugs: [...entries.keys()].filter((name) => /^content\/posts\/[^/]+\.yaml$/.test(name)).map((name) => name.slice(14, -5)).filter(isSlug).sort(),
    async readPost(slug) {
      if (!isSlug(slug)) throw new PreviewError("Invalid article slug.", 400);
      return parsePostYaml((await readBlob(`content/posts/${slug}.yaml`, 1024 * 1024)).toString("utf8"), slug);
    },
    async readImage(reference) { return readBlob(mediaRepositoryPath(reference), MAX_IMAGE_BYTES); },
  };
}

export function markdownImageReference(image) {
  return `![${(image.alt || "Describe the image").replace(/\\/g, "\\\\").replace(/[\[\]]/g, "\\$&").replace(/[\r\n]+/g, " ")}](${image.src})`;
}

export async function preparePreview(snapshot, slug) {
  const sourcePost = await snapshot.readPost(slug);
  const localized = sourcePost.en !== undefined || sourcePost.createdAt !== undefined;
  const post = localized ? projectPost(sourcePost, ENGLISH) : sourcePost;
  const ptPost = projectPost(sourcePost, PORTUGUESE);
  const issues = [];
  const ptIssues = [];
  const { readingTime: _readingTime, ...record } = sourcePost;
  if (localized) {
    for (const [locale, version, target] of [["en", sourcePost.en, issues], ["pt", sourcePost.pt, ptIssues]]) {
      if (!version) { target.push({ path: `${slug}:${locale}`, message: "This language has not been written yet." }); continue; }
      try { validatePost({ ...record, status: "published", [locale]: { ...version, publish: true } }, slug); }
      catch (error) { if (!(error instanceof ContentError)) throw error; target.push(...error.issues.filter((issue) => issue.path.includes(`:${locale}.`))); }
    }
  } else {
    try { validatePost({ ...record, status: "published" }, slug); }
    catch (error) { if (!(error instanceof ContentError)) throw error; issues.push(...error.issues); }
    try { validatePost({ ...record, status: "published", pt: { ...sourcePost.pt, publish: true } }, slug); }
    catch (error) { if (!(error instanceof ContentError)) throw error; ptIssues.push(...error.issues.filter((issue) => issue.path.includes(":pt."))); }
  }
  for (const [version, target] of [[post, issues], [ptPost, ptIssues]]) {
    if (!version) continue;
    try { referencedImages(version); }
    catch (error) { if (!(error instanceof ContentError)) throw error; target.push(...error.issues); }
  }
  const media = {};
  const images = [...(sourcePost.cover ? [sourcePost.cover] : []), ...sourcePost.images];
  for (const image of images) {
    if (media[image.src]) continue;
    try {
      const asset = await inspectImage(await snapshot.readImage(image.src), image.src);
      media[image.src] = { ...asset, alt: image.alt,
        url: `/preview/media/${snapshot.revision}/${slug}/${asset.url.split("/").at(-1)}`,
        ...(asset.posterUrl ? { posterUrl: `/preview/media/${snapshot.revision}/${slug}/${asset.posterUrl.split("/").at(-1)}` } : {}),
      };
    } catch (error) {
      if (error instanceof PreviewError && error.status === 401) throw error;
      issues.push({ path: image.src, message: error instanceof ContentError || error instanceof PreviewError ? error.message : "Cannot load this image." });
    }
  }
  return { post, ptPost, sourcePost, media, images, issues, ptIssues, revision: snapshot.revision };
}

export async function readPreviewImage(snapshot, slug, filename) {
  if (!isSlug(slug) || !/^[a-f0-9]{64}\.(png|jpg|webp|gif)$/.test(filename)) throw new PreviewError("Invalid preview image.", 400);
  const post = await snapshot.readPost(slug);
  for (const image of [...(post.cover ? [post.cover] : []), ...post.images]) {
    const bytes = await snapshot.readImage(image.src);
    const asset = await inspectImage(bytes, image.src);
    if (asset.url.split("/").at(-1) === filename) return bytes;
    if (asset.posterUrl?.split("/").at(-1) === filename) return gifPoster(bytes);
  }
  throw new PreviewError("Image not declared in this saved article.", 404);
}
