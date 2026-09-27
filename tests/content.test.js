import { describe, expect, it } from "vitest";
import { credentials, education, experience, profile, terminalSteps } from "@/data/profile";
import { getPublicContent } from "@/lib/public-content";
import { selectPublishedPosts } from "@portfolio/blog-content/model";
import { posts as legacyPosts } from "./fixtures/legacy-post";
import { validateProfileContent } from "@/lib/content-validation";

describe("portfolio content", () => {
  it("contains the complete normalized resume seed", () => {
    expect(validateProfileContent({ profile, experience, education, credentials, terminalSteps })).toEqual([]);
    expect(experience.map((item) => item.organization)).toEqual([
      "Mercado Livre",
      "PagBank",
      "Go Ahead IT",
      "Federal University of ABC (UFABC)",
      "Green Team Hacker Club — UFABC",
    ]);
    expect(profile.contact).toMatchObject({
      emailHref: "mailto:contato@lucas-reis.com",
      linkedIn: "https://www.linkedin.com/in/lucas-reis-o",
      github: "https://github.com/lucasr-o",
      x: "https://x.com/lucasreis_lk",
    });
    expect(profile.contact).not.toHaveProperty("phoneHref");
  });

  it("rejects non-reserved network targets in the terminal", () => {
    const errors = validateProfileContent({
      profile,
      experience,
      education,
      credentials,
      terminalSteps: [{ command: "nmap example.com", output: [] }],
    });
    expect(errors).toContain("terminal target is not reserved: nmap example.com");
  });
});

describe("blog content", () => {
  it("validates the documented example, preserving the original slug, author and prose", async () => {
    const { posts, media } = await getPublicContent();
    const latestPost = posts[0];
    const original = legacyPosts[0];
    expect(posts.some((post) => post.slug === "security-reviews-that-move-at-product-speed")).toBe(true);
    expect(latestPost).toMatchObject({ slug: original.slug, title: original.title, summary: original.summary, author: original.author, isPlaceholder: true });
    expect(latestPost.body).toContain(original.introduction.replace("lucas-reis.dev", "lucas-reis.com"));
    for (const section of original.sections) {
      expect(latestPost.body).toContain(`## ${section.heading}`);
      for (const paragraph of section.paragraphs) expect(latestPost.body).toContain(paragraph);
    }
    expect(Object.keys(media)).toHaveLength(1);
  });

  it("selects a newly added later article without duplicated home data", async () => {
    const { posts } = await getPublicContent();
    const collection = [...posts, { ...posts[0], slug: "newer", publishedAt: "2026-09-28T00:00:00Z", updatedAt: null }];
    const latest = selectPublishedPosts(collection, "2026-09-28T00:00:00Z")[0];
    expect(latest.slug).toBe("newer");
  });
});
