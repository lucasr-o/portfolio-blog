import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { blogPagePath, pageCount, paginationItems, parseArchivePage, postsOnPage } from "@portfolio/blog-content/pagination";
import { buildSearchIndex, normalizeSearchQuery, searchHref, searchPage, searchPosts, searchTerms } from "@portfolio/blog-content/search";
import { writeSearchIndexes } from "../scripts/write-search-index.mjs";

const post = (slug, body, title = slug) => ({ slug, title, summary: "Summary", tags: ["Research"],
  body, publishedAt: "2026-01-01T00:00:00.000Z", readingTime: "1 min read" });

describe("blog pagination", () => {
  it("slices six posts and validates numbered paths", () => {
    const posts = Array.from({ length: 7 }, (_, index) => index);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(6)).toBe(1);
    expect(pageCount(7)).toBe(2);
    expect(postsOnPage(posts, 1)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(postsOnPage(posts, 2)).toEqual([6]);
    expect(blogPagePath("pt-BR", 2)).toBe("/pt/blog/page/2/");
    expect(parseArchivePage("2", 2)).toBe(2);
    for (const invalid of ["0", "1", "02", "3", "1e2", "9999999", "<script>"]) {
      expect(parseArchivePage(invalid, 2)).toBeNull();
    }
  });

  it("keeps large page ranges compact and marks gaps", () => {
    expect(paginationItems(1, 2)).toEqual([1, 2]);
    expect(paginationItems(8, 20)).toEqual([1, "ellipsis", 7, 8, 9, "ellipsis", 20]);
  });
});

describe("safe full-text search", () => {
  const index = buildSearchIndex([post("older", "Only body: criptografia aplicada."),
    post("newer", "Cryptography research and exploitation", "A new post")], "en");

  it("finds body-only matches with folded accents, prefixes and combined terms", () => {
    expect(searchPosts(index, "CRIPTOGRAFIA").map(({ slug }) => slug)).toEqual(["older"]);
    expect(searchPosts(index, "cryptog research").map(({ slug }) => slug)).toEqual(["newer"]);
    expect(searchPosts(index, "cryptog missing")).toEqual([]);
    expect(searchTerms("Árvore ÁRVORE")).toEqual(["arvore"]);
  });

  it("bounds input and keeps injection-looking strings inert", () => {
    expect(normalizeSearchQuery(" a\u0000  b ")).toBe("a b");
    expect([...normalizeSearchQuery("x".repeat(1000))]).toHaveLength(120);
    expect(searchTerms("word ".repeat(100))).toEqual(["word"]);
    expect(searchPosts(index, "<img src=x onerror=alert(1)>")).toEqual([]);
    expect(searchPage("999999", 7)).toBe(2);
    expect(searchPage("-1", 7)).toBe(1);
    expect(searchHref("en", "a & b", 2)).toBe("/blog/?q=a+%26+b&page=2");
  });

  it("stops publication when a locale index exceeds its reviewed size budget", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "blog-search-budget-"));
    try {
      const body = Array.from({ length: 60_000 }, (_, index) => `term${index.toString(36).padStart(7, "0")}`).join(" ");
      await expect(writeSearchIndexes(directory, { posts: [post("large", body)], ptPosts: [] }))
        .rejects.toThrow(/search index is .* bytes.*limit/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
