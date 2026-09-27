import { posts } from "@/data/posts";
import { site } from "@/data/profile";

export const dynamic = "force-static";

export default function sitemap() {
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/blog/`, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}/`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}
