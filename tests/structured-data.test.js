import { describe, expect, it } from "vitest";
import { getPublicContent } from "@/lib/public-content";
const { posts: [latestPost] } = await getPublicContent();
import { profile, site } from "@/data/profile";
import { createBlogPostingSchema, createPersonSchema } from "@/lib/structured-data";

describe("structured data", () => {
  it("describes the public person identity", () => {
    const schema = createPersonSchema();
    expect(schema).toMatchObject({
      "@type": "Person",
      name: profile.name,
      url: site.url,
      jobTitle: profile.role,
      email: "contato@lucas-reis.com",
      sameAs: [
        "https://www.linkedin.com/in/lucas-reis-o",
        "https://github.com/lucasr-o",
        "https://x.com/lucasreis_lk",
      ],
    });
    expect(schema).not.toHaveProperty("telephone");
  });

  it("matches the visible placeholder article", () => {
    expect(createBlogPostingSchema(latestPost)).toMatchObject({
      "@type": "BlogPosting",
      headline: latestPost.title,
      description: latestPost.summary,
      datePublished: latestPost.publishedAt,
      mainEntityOfPage: `${site.url}/blog/${latestPost.slug}/`,
    });
  });
});
