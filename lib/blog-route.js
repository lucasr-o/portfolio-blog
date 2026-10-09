import { articlePath, ENGLISH, PORTUGUESE } from "@portfolio/blog-content/locale";
import { site } from "@/data/profile";

export function findPublicArticle(publication, slug, locale = ENGLISH) {
  const collection = locale === PORTUGUESE ? publication.ptPosts : publication.posts;
  return collection.find((post) => post.slug === slug);
}

export function articleMetadata(post, hasCounterpart) {
  const locale = post.locale ?? ENGLISH;
  const canonical = articlePath(post, locale);
  const alternates = { canonical };
  if (hasCounterpart) alternates.languages = { en: articlePath(post, ENGLISH), "pt-BR": articlePath(post, PORTUGUESE) };
  return {
    title: post.title,
    description: post.summary,
    authors: [{ name: post.author, url: site.url }],
    alternates,
    openGraph: {
      title: post.title, description: post.summary, url: canonical,
      type: "article", locale: locale === PORTUGUESE ? "pt_BR" : "en_US",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author], tags: post.tags,
    },
  };
}
