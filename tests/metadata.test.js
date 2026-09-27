import { describe, expect, it } from "vitest";
import { metadata as homeMetadata } from "@/app/page";
import { metadata as blogMetadata } from "@/app/blog/page";
import { generateMetadata as generatePostMetadata } from "@/app/blog/[slug]/page";
import { latestPost } from "@/data/posts";

describe("route metadata", () => {
  it("is unique and canonical across public routes", async () => {
    const postMetadata = await generatePostMetadata({ params: Promise.resolve({ slug: latestPost.slug }) });
    expect(new Set([homeMetadata.title, blogMetadata.title, postMetadata.title]).size).toBe(3);
    expect(homeMetadata.alternates.canonical).toBe("/");
    expect(blogMetadata.alternates.canonical).toBe("/blog/");
    expect(postMetadata.alternates.canonical).toBe(`/blog/${latestPost.slug}/`);
    expect(postMetadata.openGraph.type).toBe("article");
  });
});
