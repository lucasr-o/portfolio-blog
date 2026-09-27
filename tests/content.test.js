import { describe, expect, it } from "vitest";
import { credentials, education, experience, profile, terminalSteps } from "@/data/profile";
import { latestPost, posts, sortedPosts } from "@/data/posts";
import { validatePostsContent, validateProfileContent } from "@/lib/content-validation";

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
  it("keeps the placeholder record internally consistent", () => {
    expect(validatePostsContent(posts)).toEqual([]);
    expect(latestPost).toBe(sortedPosts[0]);
    expect(posts.some((post) => post.slug === "security-reviews-that-move-at-product-speed")).toBe(true);
    expect(latestPost.publishedAt).toBe([...posts].map((post) => post.publishedAt).sort().at(-1));
  });

  it("selects a newly added later article without duplicated home data", async () => {
    const collection = [...posts, { ...posts[0], slug: "newer", publishedAt: "2099-01-01" }];
    const latest = [...collection].sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt))[0];
    expect(latest.slug).toBe("newer");
  });
});
