import { describe, expect, it } from "vitest";
import { metadata as homeMetadata } from "@/app/(en)/page";
import { metadata as blogMetadata } from "@/app/(en)/blog/page";
import { metadata as portugueseBlogMetadata } from "@/app/(pt)/pt/blog/page";
import { generateMetadata as generatePostMetadata } from "@/app/(en)/blog/[slug]/page";
import { getPublicContent } from "@/lib/public-content";
const { posts: [latestPost] } = await getPublicContent();

describe("route metadata", () => {
  it("is unique and canonical across public routes", async () => {
    const postMetadata = await generatePostMetadata({ params: Promise.resolve({ slug: latestPost.slug }) });
    expect(new Set([homeMetadata.title, blogMetadata.title, portugueseBlogMetadata.title, postMetadata.title]).size).toBe(4);
    expect(homeMetadata.alternates.canonical).toBe("/");
    expect(blogMetadata.alternates.canonical).toBe("/blog/");
    expect(portugueseBlogMetadata.alternates.canonical).toBe("/pt/blog/");
    expect(postMetadata.alternates.canonical).toBe(`/blog/${latestPost.slug}/`);
    expect(postMetadata.openGraph.type).toBe("article");
  });
});
