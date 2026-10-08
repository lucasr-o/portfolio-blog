import { getPublicContent } from "@/lib/public-content";
import { site } from "@/data/profile";
import { articlePath } from "@portfolio/blog-content/locale";
import { blogPagePath, pageCount } from "@portfolio/blog-content/pagination";

export const dynamic = "force-static";

export default async function sitemap() {
  const { posts, ptPosts } = await getPublicContent();
  const translatedSlugs = new Set(ptPosts.map((post) => post.slug));
  const indexLanguages = { en: `${site.url}/blog/`, "pt-BR": `${site.url}/pt/blog/` };
  const articleLanguages = (post) => translatedSlugs.has(post.slug) ? {
    alternates: { languages: { en: `${site.url}${articlePath(post)}`, "pt-BR": `${site.url}${articlePath(post, "pt-BR")}` } },
  } : {};
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/blog/`, changeFrequency: "weekly", priority: 0.8, alternates: { languages: indexLanguages } },
    { url: `${site.url}/pt/blog/`, changeFrequency: "weekly", priority: 0.8, alternates: { languages: indexLanguages } },
    ...[["en", posts], ["pt-BR", ptPosts]].flatMap(([locale, available]) =>
      Array.from({ length: pageCount(available.length) - 1 }, (_, index) => ({
        url: `${site.url}${blogPagePath(locale, index + 2)}`, changeFrequency: "weekly", priority: 0.6,
      }))),
    ...posts.map((post) => ({
      url: `${site.url}${articlePath(post)}`,
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.7,
      ...articleLanguages(post),
    })),
    ...ptPosts.map((post) => ({
      url: `${site.url}${articlePath(post, "pt-BR")}`,
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.7,
      ...articleLanguages(post),
    })),
  ];
}
