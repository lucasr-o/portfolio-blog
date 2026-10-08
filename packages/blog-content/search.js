import { articlePath, blogPath } from "./locale.js";
import { POSTS_PER_PAGE } from "./pagination.js";

export const MAX_SEARCH_LENGTH = 120;
export const MAX_SEARCH_TERMS = 8;
const WORDS = /[\p{L}\p{N}]+/gu;

export function normalizeSearchQuery(value) {
  if (typeof value !== "string") return "";
  return [...value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().replace(/\s+/g, " ")]
    .slice(0, MAX_SEARCH_LENGTH).join("");
}

export function searchTerms(value) {
  if (typeof value !== "string") return [];
  return [...new Set((value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(WORDS) ?? [])
    .filter((term) => term.length <= 64))].slice(0, MAX_SEARCH_TERMS);
}

export function buildSearchIndex(posts, locale) {
  const terms = new Map();
  const entries = posts.map((post, index) => {
    for (const term of allDocumentTerms([post.title, post.summary, ...post.tags, post.body].join(" "))) {
      if (!terms.has(term)) terms.set(term, []);
      terms.get(term).push(index);
    }
    return {
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      tags: post.tags,
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      locale,
    };
  });
  return { schema: 1, locale, posts: entries,
    terms: Object.fromEntries([...terms].sort(([left], [right]) => left.localeCompare(right, "en"))) };
}

function allDocumentTerms(value) {
  return [...new Set((value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(WORDS) ?? [])
    .filter((term) => term.length <= 64))];
}

export function searchPosts(index, query) {
  if (index?.schema !== 1 || !["en", "pt-BR"].includes(index.locale) || !Array.isArray(index.posts) ||
      !index.terms || typeof index.terms !== "object" || Array.isArray(index.terms)) {
    throw new Error("Invalid public search index");
  }
  const requested = searchTerms(normalizeSearchQuery(query));
  if (requested.length === 0) return [];
  const vocabulary = Object.keys(index.terms);
  let matches = null;
  for (const token of requested) {
    const hits = new Set();
    for (const term of vocabulary) {
      if (term === token || (token.length >= 3 && term.startsWith(token))) {
        if (!Array.isArray(index.terms[term])) throw new Error("Invalid public search index");
        for (const postIndex of index.terms[term]) {
          if (Number.isSafeInteger(postIndex) && postIndex >= 0 && postIndex < index.posts.length) hits.add(postIndex);
        }
      }
    }
    matches = matches === null ? hits : new Set([...matches].filter((postIndex) => hits.has(postIndex)));
    if (matches.size === 0) break;
  }
  return [...matches].sort((a, b) => a - b).map((postIndex) => index.posts[postIndex])
    .filter((post) => post && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) &&
      articlePath(post, index.locale).startsWith(blogPath(index.locale)));
}

export function searchPage(value, totalMatches) {
  const parsed = typeof value === "string" && /^[1-9]\d{0,5}$/.test(value) ? Number(value) : 1;
  return Math.min(parsed, Math.max(1, Math.ceil(totalMatches / POSTS_PER_PAGE)));
}

export function searchHref(locale, query, page = 1) {
  const parameters = new URLSearchParams({ q: normalizeSearchQuery(query) });
  if (page > 1) parameters.set("page", String(page));
  return `${blogPath(locale)}?${parameters}`;
}
