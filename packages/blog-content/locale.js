import { readingTime } from "./format.js";
import { ContentError, normalizeInstant, validatePost } from "./model.js";

export const ENGLISH = "en";
export const PORTUGUESE = "pt-BR";

export function articlePath(post, locale = ENGLISH) {
  return `${locale === PORTUGUESE ? "/pt" : ""}/blog/${post.slug}/`;
}

export function blogPath(locale = ENGLISH) {
  return locale === PORTUGUESE ? "/pt/blog/" : "/blog/";
}

export function projectPost(post, locale = ENGLISH) {
  if (post.en !== undefined || post.createdAt !== undefined) {
    const version = locale === PORTUGUESE ? post.pt : post.en;
    if (!version) return null;
    return {
      slug: post.slug, status: post.status, createdAt: post.createdAt,
      author: post.author, isPlaceholder: post.isPlaceholder,
      images: post.images, locale,
      title: version.title, summary: version.summary, body: version.body,
      tags: version.tags, publishedAt: version.publishedAt,
      updatedAt: version.updatedAt,
      cover: post.cover ? { ...post.cover, alt: version.coverAlt } : null,
      readingTime: readingTime(version.body, locale),
    };
  }
  if (locale !== PORTUGUESE) return { ...post, locale: ENGLISH };
  const pt = post.pt ?? { title: "", summary: "", body: "", tags: [], coverAlt: "" };
  return {
    ...post,
    locale: PORTUGUESE,
    title: pt.title ?? "",
    summary: pt.summary ?? "",
    body: pt.body ?? "",
    tags: pt.tags ?? [],
    cover: post.cover ? { ...post.cover, alt: pt.coverAlt ?? "" } : null,
    readingTime: readingTime(pt.body ?? "", PORTUGUESE),
  };
}

export function isLocalePublic(post, locale, publicationTime) {
  const cutoff = normalizeInstant(publicationTime);
  if (post.status === "draft") return false;
  if (post.en !== undefined || post.createdAt !== undefined) {
    if (post.status !== "published") return false;
    const version = locale === PORTUGUESE ? post.pt : post.en;
    return version?.publish === true && Boolean(version.publishedAt) && version.publishedAt <= cutoff;
  }
  return Boolean(post.publishedAt) && post.publishedAt <= cutoff &&
    (locale !== PORTUGUESE || post.pt?.publish === true);
}

export function selectLocalizedPosts(records, publicationTime, locale = ENGLISH) {
  const cutoff = normalizeInstant(publicationTime);
  const slugs = new Set();
  const selected = [];
  for (const record of records) {
    if (slugs.has(record.slug)) throw new ContentError([{ path: `${record.slug}:slug`, message: "Duplicate slug." }]);
    slugs.add(record.slug);
    const { readingTime: _readingTime, locale: _locale, ...source } = record;
    const post = validatePost(source, record.slug);
    if (isLocalePublic(post, locale, cutoff)) selected.push(projectPost(post, locale));
  }
  return selected.sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug, "en"));
}

export function selectPortuguesePosts(publishedEnglishPosts) {
  return publishedEnglishPosts.filter((post) => post.pt?.publish === true).map((post) => projectPost(post, PORTUGUESE));
}

const copies = {
  en: {
    writing: "Writing", blogTitle: "Posts.",
    blogIntroduction: "Thoughts and field notes on security, technology, and whatever else is worth exploring.",
    latestNotes: "Recent posts", articleSingular: "post", articlePlural: "posts",
    empty: "No articles yet. New notes will appear here.", latest: "Latest",
    readArticle: "Read article", topics: "Topics", placeholder: "Placeholder article",
    untitled: "Untitled draft", writtenBy: "Written by", back: "Back to blog",
    articleTable: "Article table", language: "Article language", indexLanguage: "Blog language",
  },
  "pt-BR": {
    writing: "Publicações", blogTitle: "Artigos.",
    blogIntroduction: "Ideias e notas sobre segurança, tecnologia e outros assuntos que valem a conversa.",
    latestNotes: "Artigos recentes", articleSingular: "artigo", articlePlural: "artigos",
    empty: "Ainda não há artigos em português. Novas notas aparecerão aqui.", latest: "Mais recente",
    readArticle: "Ler artigo", topics: "Tópicos", placeholder: "Artigo de demonstração",
    untitled: "Rascunho sem título", writtenBy: "Escrito por", back: "Voltar ao blog",
    articleTable: "Tabela do artigo", language: "Idioma do artigo", indexLanguage: "Idioma do blog",
  },
};

export function blogCopy(locale = ENGLISH) {
  return copies[locale] ?? copies.en;
}
