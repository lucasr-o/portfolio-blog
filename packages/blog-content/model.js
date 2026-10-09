import { parseDocument, stringify } from "yaml";
import { readingTime } from "./format.js";

export const DEFAULT_AUTHOR = "Lucas Reis de Oliveira da Silva";
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const statuses = new Set(["draft", "published", "scheduled"]);
const knownFields = new Set(["slug", "title", "summary", "author", "status", "publishedAt", "updatedAt", "tags", "body", "cover", "images", "isPlaceholder", "pt"]);
const localizedFields = new Set(["slug", "status", "createdAt", "author", "cover", "images", "isPlaceholder", "pt", "en"]);
const versionFields = new Set(["publish", "title", "summary", "body", "tags", "coverAlt", "publishedAt", "updatedAt"]);
const wrappedRootFields = new Set(["title", "editorial"]);
const editorialFields = new Set(["titleLocale", "status", "createdAt", "author", "cover", "images", "isPlaceholder", "pt", "en"]);
const wrappedShape = Symbol("wrapped editorial source");

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
  if (typeof reference !== "string" || reference.length > 300 || !/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp|gif)$/.test(reference) || reference.includes("..")) {
    throw new Error("Use a local /media/... PNG, JPEG, WebP or GIF reference; URLs and traversal are not allowed.");
  }
  return `content${reference}`;
}

export function validatePost(raw, slug, source = `content/posts/${slug}.yaml`) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "editorial" in raw) {
    return validateWrappedPost(raw, slug, source);
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && ("en" in raw || "createdAt" in raw)) {
    return validateLocalizedPost(raw, slug, source);
  }
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
  if (post.cover && /\.gif$/i.test(post.cover.src)) issue("cover.src", "Use a still PNG, JPEG or WebP cover.");
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

function validateWrappedPost(raw, slug, source) {
  const issues = [];
  const issue = (field, message) => issues.push({ path: `${source}:${field}`, message });
  for (const field of Object.keys(raw)) if (!wrappedRootFields.has(field)) issue(field, "Unknown root field in an editorial record.");
  if (typeof raw.title !== "string" || !raw.title.trim()) issue("title", "Provide the original title used to identify this article.");
  const editorial = raw.editorial;
  if (!editorial || typeof editorial !== "object" || Array.isArray(editorial)) {
    issue("editorial", "Expected a grouped editorial record.");
    throw new ContentError(issues);
  }
  for (const field of Object.keys(editorial)) if (!editorialFields.has(field)) issue(`editorial.${field}`, "Unknown editorial field.");
  if (editorial.titleLocale !== "pt" && editorial.titleLocale !== "en") {
    issue("editorial.titleLocale", "Choose pt for a Portuguese-origin article or en for a migrated English-origin article.");
  }
  if (issues.length) throw new ContentError(issues);

  const resolveVersion = (locale) => {
    const value = editorial[locale];
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const inheritedTitle = editorial.titleLocale === locale && value.title === undefined ? raw.title : value.title;
    return { ...value, ...(inheritedTitle === undefined ? {} : { title: inheritedTitle }) };
  };
  let normalized;
  try {
    normalized = validateLocalizedPost({
      status: editorial.status,
      createdAt: editorial.createdAt,
      author: editorial.author,
      cover: editorial.cover,
      images: editorial.images,
      isPlaceholder: editorial.isPlaceholder,
      pt: resolveVersion("pt"),
      en: resolveVersion("en"),
    }, slug, source);
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    throw new ContentError(error.issues.map(({ path, message }) => ({
      path: path.replace(`${source}:`, `${source}:editorial.`), message,
    })));
  }
  Object.defineProperty(normalized, wrappedShape, {
    value: { title: raw.title, titleLocale: editorial.titleLocale },
  });
  return normalized;
}

function validateLocalizedPost(raw, slug, source) {
  const issues = [];
  const issue = (field, message) => issues.push({ path: `${source}:${field}`, message });
  if (!isSlug(slug)) issue("slug", "Use a unique lowercase, hyphenated slug of at most 120 characters.");
  if (raw.slug !== undefined && raw.slug !== slug) issue("slug", "Must match the filename.");
  for (const field of Object.keys(raw)) if (!localizedFields.has(field)) issue(field, "Unknown editorial field.");

  const status = raw.status ?? "draft";
  if (status !== "draft" && status !== "published") issue("status", "Choose draft or published.");
  let createdAt = null;
  if (raw.createdAt !== undefined && raw.createdAt !== null && raw.createdAt !== "") {
    try { createdAt = normalizeInstant(raw.createdAt); } catch (error) { issue("createdAt", error.message); }
  }
  const author = raw.author ?? DEFAULT_AUTHOR;
  if (typeof author !== "string" || (status === "published" && !author.trim())) issue("author", "Provide an author before publishing.");
  const isPlaceholder = raw.isPlaceholder ?? false;
  if (typeof isPlaceholder !== "boolean") issue("isPlaceholder", "Expected true or false.");

  let cover = null;
  if (raw.cover !== undefined && raw.cover !== null) {
    if (typeof raw.cover !== "object" || Array.isArray(raw.cover)) issue("cover", "Expected an image with src.");
    else if (raw.cover.src) {
      try { mediaRepositoryPath(raw.cover.src); } catch (error) { issue("cover.src", error.message); }
      if (/\.gif$/i.test(raw.cover.src)) issue("cover.src", "Use a still PNG, JPEG or WebP cover.");
      cover = { src: raw.cover.src };
    } else if (Object.keys(raw.cover).some((key) => key !== "src")) issue("cover.src", "Provide a source for the cover, or remove it.");
  }

  const images = [];
  if (raw.images !== undefined && !Array.isArray(raw.images)) issue("images", "Expected a list of images.");
  else for (const [index, image] of (raw.images ?? []).entries()) {
    if (!image || typeof image !== "object" || Array.isArray(image)) { issue(`images[${index}]`, "Expected an image with src."); continue; }
    try { mediaRepositoryPath(image.src); } catch (error) { issue(`images[${index}].src`, error.message); }
    if (image.alt !== undefined && typeof image.alt !== "string") issue(`images[${index}].alt`, "Expected text.");
    images.push({ src: image.src, ...(image.alt === undefined ? {} : { alt: image.alt }) });
  }
  if (new Set(images.map((image) => image.src)).size !== images.length) issue("images", "Image references must be unique.");

  const version = (value, locale) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== "object" || Array.isArray(value)) { issue(locale, "Expected language fields."); return null; }
    for (const field of Object.keys(value)) if (!versionFields.has(field)) issue(`${locale}.${field}`, "Unknown language field.");
    const publish = value.publish ?? false;
    if (typeof publish !== "boolean") issue(`${locale}.publish`, "Expected true or false.");
    const publicVersion = status === "published" && publish === true;
    const normalized = { publish };
    for (const field of ["title", "summary", "body", "coverAlt"]) {
      normalized[field] = value[field] ?? "";
      if (typeof normalized[field] !== "string") issue(`${locale}.${field}`, "Expected text.");
      else if (publicVersion && field !== "coverAlt" && !normalized[field].trim()) issue(`${locale}.${field}`, "Required to publish this language.");
    }
    if (publicVersion && cover && !normalized.coverAlt.trim()) issue(`${locale}.coverAlt`, "Describe the shared cover in this language.");
    normalized.tags = value.tags ?? [];
    if (!Array.isArray(normalized.tags) || normalized.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 60)) {
      issue(`${locale}.tags`, "Expected a list of non-empty texts, each at most 60 characters.");
    }
    for (const field of ["publishedAt", "updatedAt"]) {
      normalized[field] = null;
      if (value[field] !== undefined && value[field] !== null && value[field] !== "") {
        try { normalized[field] = normalizeInstant(value[field]); } catch (error) { issue(`${locale}.${field}`, error.message); }
      }
      // New records derive their first-publication instant from the first
      // qualifying commit on main. A date in source is only a legacy pin.
    }
    if (normalized.updatedAt && normalized.publishedAt && normalized.updatedAt < normalized.publishedAt) {
      issue(`${locale}.updatedAt`, "Must not precede the first-publication date.");
    }
    return normalized;
  };

  const pt = version(raw.pt, "pt");
  const en = version(raw.en, "en");
  if (status === "published" && !pt?.publish && !en?.publish) issue("status", "Approve at least one complete language before publishing.");
  if (issues.length) throw new ContentError(issues);
  return { slug, status, createdAt, author, isPlaceholder, cover, images, pt, en };
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
  const origin = post[wrappedShape];
  const { slug, readingTime: _readingTime, ...record } = post;
  // Validate before serializing, but never trim or reformat the Markdown string.
  validatePost(record, slug);
  if (origin) {
    const { title, titleLocale } = origin;
    const { pt, en, ...shared } = record;
    if (shared.createdAt === null) delete shared.createdAt;
    const localize = (value, locale) => {
      if (!value) return value;
      const copy = { ...value };
      if (locale === titleLocale && copy.title === title) delete copy.title;
      if (copy.publishedAt === null) delete copy.publishedAt;
      if (copy.updatedAt === null) delete copy.updatedAt;
      return copy;
    };
    return stringify({ title, editorial: { titleLocale, ...shared, pt: localize(pt, "pt"), en: localize(en, "en") } }, { lineWidth: 0 });
  }
  return stringify(record, { lineWidth: 0 });
}

export function selectPublishedPosts(posts, publicationTime) {
  const cutoff = normalizeInstant(publicationTime);
  const slugs = new Set();
  const validated = [];
  for (const post of posts) {
    if (slugs.has(post.slug)) throw new ContentError([{ path: `${post.slug}:slug`, message: "Duplicate slug." }]);
    slugs.add(post.slug);
    const { readingTime: _readingTime, locale: _locale, ...record } = post;
    validated.push(validatePost(record, post.slug));
  }
  return validated.filter((post) => post.status !== "draft" && post.publishedAt <= cutoff)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug, "en"));
}
