import { parseDocument, stringify } from "yaml";
import { readingTime } from "./format.js";

export const DEFAULT_AUTHOR = "Lucas Reis de Oliveira da Silva";
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const statuses = new Set(["draft", "published", "scheduled"]);
const knownFields = new Set(["slug", "title", "summary", "author", "status", "publishedAt", "updatedAt", "tags", "body", "cover", "images", "isPlaceholder", "pt"]);

export class ContentError extends Error {
  constructor(issues) {
    super(issues.map(({ path, message }) => `${path}: ${message}`).join("\n"));
    this.name = "ContentError";
    this.issues = issues;
  }
}

export function isSlug(value) {
  return typeof value === "string" && value.length <= 120 && SLUG_PATTERN.test(value);
}

export function normalizeInstant(value) {
  if (typeof value !== "string") throw new Error("Use an ISO date and time with an explicit timezone.");
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  const milliseconds = Date.parse(value);
  if (!match || !Number.isFinite(milliseconds)) throw new Error("Use an ISO date and time with an explicit timezone (for example 2026-10-01T09:00:00-03:00).");
  const [, year, month, day] = match;
  const calendar = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (calendar.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) throw new Error("Date does not exist in the calendar.");
  return new Date(milliseconds).toISOString();
}

export function mediaRepositoryPath(reference) {
  if (typeof reference !== "string" || reference.length > 300 || !/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp)$/.test(reference) || reference.includes("..")) {
    throw new Error("Use a local /media/... PNG, JPEG or WebP reference; URLs and traversal are not allowed.");
  }
  return `content${reference}`;
}

export function validatePost(raw, slug, source = `content/posts/${slug}.yaml`) {
  const issues = [];
  const issue = (field, message) => issues.push({ path: `${source}:${field}`, message });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ContentError([{ path: source, message: "Expected a YAML object." }]);
  if (!isSlug(slug)) issue("slug", "Use a unique lowercase, hyphenated slug of at most 120 characters.");
  if (raw.slug !== undefined && raw.slug !== slug) issue("slug", "Must match the filename.");
  for (const field of Object.keys(raw)) if (!knownFields.has(field)) issue(field, "Unknown editorial field.");
  const post = { slug, status: raw.status ?? "draft" };
  if (!statuses.has(post.status)) issue("status", "Choose draft, published or scheduled.");
  for (const field of ["title", "summary", "body", "author"]) {
    post[field] = raw[field] ?? (field === "author" ? DEFAULT_AUTHOR : "");
    if (typeof post[field] !== "string") issue(field, "Expected text.");
    else if (post.status !== "draft" && !post[field].trim()) issue(field, "Required for publication.");
  }
  for (const field of ["publishedAt", "updatedAt"]) {
    post[field] = null;
    const value = raw[field];
    if (value !== undefined && value !== null && value !== "") {
      try { post[field] = normalizeInstant(value); } catch (error) { issue(field, error.message); }
    } else if (field === "publishedAt" && post.status !== "draft") issue(field, "Required for publication, with an explicit timezone.");
  }
  if (post.updatedAt && post.publishedAt && post.updatedAt < post.publishedAt) issue("updatedAt", "Must not precede publishedAt.");
  post.tags = raw.tags ?? [];
  if (!Array.isArray(post.tags) || post.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 60)) issue("tags", "Expected a list of non-empty texts, each at most 60 characters.");
  post.isPlaceholder = raw.isPlaceholder ?? false;
  if (typeof post.isPlaceholder !== "boolean") issue("isPlaceholder", "Expected true or false.");
  const media = (value, field) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) { issue(field, "Expected an image with src and alt."); return null; }
    const { src, alt = "" } = value;
    if (!src && !alt && field === "cover") return null;
    try { mediaRepositoryPath(src); } catch (error) { issue(`${field}.src`, error.message); }
    if (typeof alt !== "string" || (post.status !== "draft" && !alt.trim())) issue(`${field}.alt`, "Provide descriptive alternative text before publishing.");
    return { src, alt };
  };
  post.cover = raw.cover ? media(raw.cover, "cover") : null;
  post.images = [];
  if (raw.images !== undefined && !Array.isArray(raw.images)) issue("images", "Expected a list of images.");
  else post.images = (raw.images ?? []).map((value, index) => media(value, `images[${index}]`)).filter(Boolean);
  const refs = post.images.map((image) => image.src);
  if (new Set(refs).size !== refs.length) issue("images", "Image references must be unique.");
  if (raw.pt !== undefined && raw.pt !== null) {
    if (typeof raw.pt !== "object" || Array.isArray(raw.pt)) issue("pt", "Expected Portuguese translation fields.");
    else {
      const allowed = new Set(["publish", "title", "summary", "body", "tags", "coverAlt"]);
      for (const field of Object.keys(raw.pt)) if (!allowed.has(field)) issue(`pt.${field}`, "Unknown translation field.");
      const pt = { publish: raw.pt.publish ?? false };
      if (typeof pt.publish !== "boolean") issue("pt.publish", "Expected true or false.");
      for (const field of ["title", "summary", "body", "coverAlt"]) {
        pt[field] = raw.pt[field] ?? "";
        if (typeof pt[field] !== "string") issue(`pt.${field}`, "Expected text.");
        else if (pt.publish && field !== "coverAlt" && !pt[field].trim()) issue(`pt.${field}`, "Required to publish the Portuguese version.");
      }
      pt.tags = raw.pt.tags ?? [];
      if (!Array.isArray(pt.tags) || pt.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 60)) issue("pt.tags", "Expected a list of non-empty texts, each at most 60 characters.");
      if (pt.publish && post.cover && !pt.coverAlt?.trim()) issue("pt.coverAlt", "Provide Portuguese alternative text for the shared cover.");
      post.pt = pt;
    }
  }
  if (issues.length) throw new ContentError(issues);
  return { ...post, readingTime: readingTime(post.body) };
}

export function parsePostYaml(text, slug, source) {
  if (typeof text !== "string" || Buffer.byteLength(text) > 1024 * 1024) throw new ContentError([{ path: source ?? slug, message: "Article record must be text below 1 MiB." }]);
  try {
    const document = parseDocument(text, { uniqueKeys: true, schema: "core" });
    if (document.errors.length) throw document.errors[0];
    return validatePost(document.toJS({ maxAliasCount: 0 }), slug, source);
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw new ContentError([{ path: source ?? slug, message: `Invalid YAML: ${error.message}` }]);
  }
}

export function serializePost(post) {
  const { slug, readingTime: _readingTime, ...record } = post;
  // Validate before serializing, but never trim or reformat the Markdown string.
  validatePost(record, slug);
  return stringify(record, { lineWidth: 0 });
}

export function selectPublishedPosts(posts, publicationTime) {
  const cutoff = normalizeInstant(publicationTime);
  const slugs = new Set();
  const validated = [];
  for (const post of posts) {
    if (slugs.has(post.slug)) throw new ContentError([{ path: `${post.slug}:slug`, message: "Duplicate slug." }]);
    slugs.add(post.slug);
    const { readingTime: _readingTime, ...record } = post;
    validated.push(validatePost(record, post.slug));
  }
  return validated.filter((post) => post.status !== "draft" && post.publishedAt <= cutoff)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug, "en"));
}
