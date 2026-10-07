import { readingTime } from "./format.js";

export const ENGLISH = "en";
export const PORTUGUESE = "pt-BR";

export function articlePath(post, locale = ENGLISH) {
  return `${locale === PORTUGUESE ? "/pt" : ""}/blog/${post.slug}/`;
}

export function blogPath(locale = ENGLISH) {
  return locale === PORTUGUESE ? "/pt/blog/" : "/blog/";
}

export function projectPost(post, locale = ENGLISH) {
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

export function selectPortuguesePosts(publishedEnglishPosts) {
  return publishedEnglishPosts.filter((post) => post.pt?.publish === true).map((post) => projectPost(post, PORTUGUESE));
}

const copies = {
  en: {
    writing: "Writing", blogTitle: "Application security notes.",
    blogIntroduction: "Practical observations about finding risk, explaining it clearly, and helping product teams ship safer systems.",
    latestNotes: "Latest notes", articleSingular: "article", articlePlural: "articles",
    empty: "No articles yet. New notes will appear here.", latest: "Latest",
    readArticle: "Read article", topics: "Topics", placeholder: "Placeholder article",
    untitled: "Untitled draft", writtenBy: "Written by", back: "Back to blog",
    articleTable: "Article table", language: "Article language", indexLanguage: "Blog language",
  },
  "pt-BR": {
    writing: "Publicações", blogTitle: "Notas sobre segurança de aplicações.",
    blogIntroduction: "Observações práticas sobre identificar riscos, explicá-los com clareza e ajudar equipes a criar produtos mais seguros.",
    latestNotes: "Notas recentes", articleSingular: "artigo", articlePlural: "artigos",
    empty: "Ainda não há artigos em português. Novas notas aparecerão aqui.", latest: "Mais recente",
    readArticle: "Ler artigo", topics: "Tópicos", placeholder: "Artigo de demonstração",
    untitled: "Rascunho sem título", writtenBy: "Escrito por", back: "Voltar ao blog",
    articleTable: "Tabela do artigo", language: "Idioma do artigo", indexLanguage: "Idioma do blog",
  },
};

export function blogCopy(locale = ENGLISH) {
  return copies[locale] ?? copies.en;
}
