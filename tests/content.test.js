import { describe, expect, it } from "vitest";
import { credentials, education, experience, profile, terminalSteps } from "@/data/profile";
import { getPublicContent } from "@/lib/public-content";
import { selectPublishedPosts } from "@portfolio/blog-content/model";
import { readPosts } from "@portfolio/blog-content/reader";
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
  it("validates the saved demonstration draft while selecting only published content", async () => {
    const { posts, media } = await getPublicContent();
    const latestPost = posts[0];
    const original = legacyPosts[0];
    const records = await readPosts(process.cwd());
    const demonstration = records.find((post) => post.slug === original.slug);
    expect(demonstration).toMatchObject({ slug: original.slug, title: original.title, summary: original.summary, author: original.author, status: "draft" });
    expect(posts.some((post) => post.slug === original.slug)).toBe(false);
    expect(demonstration.body).toContain(original.introduction.replace("lucas-reis.dev", "lucas-reis.com"));
    for (const section of original.sections) {
      expect(demonstration.body).toContain(`## ${section.heading}`);
      for (const paragraph of section.paragraphs) expect(demonstration.body).toContain(paragraph);
    }
    expect(latestPost.status).toBe("published");
    expect(Object.keys(media).length).toBeGreaterThan(0);
  });

  it("selects a newly added later article without duplicated home data", async () => {
    const { posts } = await getPublicContent();
    const collection = [...posts, { ...posts[0], slug: "newer", publishedAt: "2030-09-28T00:00:00Z", updatedAt: null }];
    const latest = selectPublishedPosts(collection, "2030-09-28T00:00:00Z")[0];
    expect(latest.slug).toBe("newer");
  });
});
