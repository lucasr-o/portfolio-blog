import { createHash } from "node:crypto";
import { ENGLISH, PORTUGUESE, articlePath, isLocalePublic, projectPost } from "./locale.js";
import { normalizeInstant, serializePost, validatePost } from "./model.js";

const comparisonTime = "2100-01-01T00:00:00.000Z";

function publicShape(post, locale) {
  if (!isLocalePublic(post, locale, comparisonTime)) return null;
  const value = projectPost(post, locale);
  return {
    route: articlePath(value, locale), title: value.title, summary: value.summary,
    body: value.body, author: value.author, tags: value.tags,
    cover: value.cover, images: value.images, publishedAt: value.publishedAt,
    updatedAt: value.updatedAt, isPlaceholder: value.isPlaceholder,
  };
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function migrationComparison(before, after) {
  return [ENGLISH, PORTUGUESE].map((locale) => {
    const original = publicShape(before, locale);
    const migrated = publicShape(after, locale);
    return {
      locale, route: original?.route ?? migrated?.route ?? null,
      before: original ? hash(original) : null,
      after: migrated ? hash(migrated) : null,
      unchanged: hash(original) === hash(migrated),
    };
  });
}

export function migrateLegacyRecord(post, firstCommitAt = null) {
  if (post.en !== undefined || post.createdAt !== undefined) {
    throw new Error(`${post.slug} is already in the localized article format.`);
  }
  if (post.status === "scheduled") {
    throw new Error(`${post.slug} is scheduled; review its intended release before migration.`);
  }
  if (post.status !== "draft" && post.status !== "published") {
    throw new Error(`${post.slug} has an unsupported publication state.`);
  }

  const firstCommit = firstCommitAt ? normalizeInstant(firstCommitAt) : null;
  const pin = post.status === "published" ? post.publishedAt : null;
  const createdAt = [firstCommit, pin].filter(Boolean).sort()[0] ?? null;
  if (post.status === "published" && !createdAt) {
    throw new Error(`${post.slug} has no trustworthy creation date.`);
  }
  const common = {
    titleLocale: "en", status: post.status, author: post.author,
    isPlaceholder: post.isPlaceholder,
    ...(createdAt ? { createdAt } : {}),
    ...(post.cover ? { cover: { src: post.cover.src } } : {}),
    images: post.images,
    en: {
      publish: post.status === "published", summary: post.summary,
      body: post.body, tags: post.tags, coverAlt: post.cover?.alt ?? "",
      ...(pin ? { publishedAt: pin } : {}),
      ...(pin && post.updatedAt ? { updatedAt: post.updatedAt } : {}),
    },
  };
  if (post.pt) {
    common.pt = {
      publish: post.pt.publish, title: post.pt.title, summary: post.pt.summary,
      body: post.pt.body, tags: post.pt.tags, coverAlt: post.pt.coverAlt,
      ...(pin && post.pt.publish ? { publishedAt: pin } : {}),
      ...(pin && post.pt.publish && post.updatedAt ? { updatedAt: post.updatedAt } : {}),
    };
  }
  const migrated = validatePost({ title: post.title, editorial: common }, post.slug);
  const comparisons = migrationComparison(post, migrated);
  if (comparisons.some(({ unchanged }) => !unchanged)) {
    throw new Error(`${post.slug} would change public content or metadata; migration blocked.`);
  }
  return { post: migrated, yaml: serializePost(migrated), comparisons,
    creationSource: firstCommit && (!pin || firstCommit <= pin) ? "first commit" : "existing publication timestamp (review required)",
    droppedDraftDates: post.status === "draft" && Boolean(post.publishedAt || post.updatedAt),
  };
}
