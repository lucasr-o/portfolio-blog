// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validatePost } from "@portfolio/blog-content/model";
import { ENGLISH, PORTUGUESE, selectLocalizedPosts } from "@portfolio/blog-content/locale";

const first = "2026-10-01T12:00:00Z";
const later = "2026-10-15T12:00:00Z";
const cutoff = "2026-10-20T12:00:00Z";

function localized(slug, overrides = {}) {
  return validatePost({
    status: "published", createdAt: first,
    pt: { publish: true, title: `PT ${slug}`, summary: "Resumo", body: "Corpo", publishedAt: first },
    ...overrides,
  }, slug);
}

describe("independent public locale projections", () => {
  it("projects a wrapped article to the Portuguese index only until English is approved", () => {
    const record = validatePost({
      title: "Artigo de segurança",
      editorial: {
        titleLocale: "pt", status: "published", createdAt: first,
        pt: { publish: true, summary: "Resumo", body: "Corpo", publishedAt: first },
        en: { publish: false, title: "Security article", summary: "Summary", body: "Body" },
      },
    }, "artigo-de-seguranca");
    expect(selectLocalizedPosts([record], cutoff, ENGLISH)).toEqual([]);
    expect(selectLocalizedPosts([record], cutoff, PORTUGUESE)[0].title).toBe("Artigo de segurança");
  });

  it("publishes Portuguese-only content without an English route or fallback", () => {
    const records = [localized("portuguese-only")];
    expect(selectLocalizedPosts(records, cutoff, ENGLISH)).toEqual([]);
    expect(selectLocalizedPosts(records, cutoff, PORTUGUESE)).toMatchObject([{
      slug: "portuguese-only", title: "PT portuguese-only", publishedAt: "2026-10-01T12:00:00.000Z",
    }]);
  });

  it("uses the later English first-publication date to sort and feature English posts", () => {
    const olderEnglish = localized("older-english", { en: { publish: true, title: "Old English", summary: "Summary", body: "Body", publishedAt: first } });
    const translated = localized("later-translation", { en: { publish: true, title: "Later English", summary: "Summary", body: "Body", publishedAt: later } });
    expect(selectLocalizedPosts([olderEnglish, translated], cutoff, ENGLISH).map((post) => post.slug))
      .toEqual(["later-translation", "older-english"]);
    expect(selectLocalizedPosts([olderEnglish, translated], cutoff, PORTUGUESE).map((post) => post.slug))
      .toEqual(["later-translation", "older-english"]);
    expect(selectLocalizedPosts([translated], "2026-10-10T12:00:00Z", ENGLISH)).toEqual([]);
    expect(selectLocalizedPosts([translated], "2026-10-10T12:00:00Z", PORTUGUESE)).toHaveLength(1);
  });

  it("withdraws only an unapproved language and retains English-first legacy records", () => {
    const legacy = validatePost({ title: "Legacy", summary: "Summary", body: "Body", status: "published", publishedAt: first }, "legacy");
    const withdrawn = localized("withdrawn", { en: { publish: false, title: "Translation draft", summary: "Summary", body: "Body", publishedAt: later } });
    expect(selectLocalizedPosts([legacy, withdrawn], cutoff, ENGLISH).map((post) => post.slug)).toEqual(["legacy"]);
    expect(selectLocalizedPosts([legacy, withdrawn], cutoff, PORTUGUESE).map((post) => post.slug)).toEqual(["withdrawn"]);
  });

  it("rejects duplicate slugs across schema versions", () => {
    const records = [localized("duplicate"), localized("duplicate")];
    expect(() => selectLocalizedPosts(records, cutoff, PORTUGUESE)).toThrow(/Duplicate slug/);
  });
});
