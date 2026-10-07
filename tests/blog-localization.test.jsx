// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { validatePost } from "@portfolio/blog-content/model";
import { projectPost, selectPortuguesePosts } from "@portfolio/blog-content/locale";
import { formatPostDate } from "@portfolio/blog-content/format";
import PostPreview from "@/components/PostPreview";
import Article from "@portfolio/blog-ui/Article";

const english = validatePost({
  title: "Security review", summary: "An English summary", body: "## English body\n\nSource text.",
  status: "published", publishedAt: "2026-09-18T12:00:00Z", tags: ["Security review"],
  pt: { publish: true, title: "Revisão de segurança", summary: "Um resumo em português", body: "## Corpo em português\n\nTexto-fonte.", tags: ["Revisão"] },
}, "security-review");

describe("localized blog presentation", () => {
  it("formats the same instant and reading-time label for each locale", () => {
    const pt = projectPost(english, "pt-BR");
    expect(formatPostDate(english.publishedAt)).toBe("September 18, 2026");
    expect(formatPostDate(pt.publishedAt, "pt-BR")).toMatch(/18 de setembro de 2026/);
    expect(pt.readingTime).toBe("1 min de leitura");
    expect(english.readingTime).toBe("1 min read");
  });

  it("renders Portuguese cards and articles without English content fallback", () => {
    const pt = selectPortuguesePosts([english])[0];
    const card = renderToStaticMarkup(<PostPreview post={pt} featured />);
    const article = renderToStaticMarkup(<Article post={pt} />);
    expect(card).toContain("/pt/blog/security-review");
    expect(card).toContain("Revisão de segurança");
    expect(card).toContain("Ler artigo");
    expect(card).not.toContain("An English summary");
    expect(card).not.toContain("Read article");
    expect(article).toContain("Corpo em português");
    expect(article).toContain("Escrito por");
    expect(article).not.toContain("English body");
    expect(article).not.toContain("Written by");
  });

  it("keeps the English Latest Writing card unchanged when Portuguese is approved", () => {
    const withoutTranslation = validatePost({
      title: english.title, summary: english.summary, body: english.body,
      status: "published", publishedAt: english.publishedAt, tags: english.tags,
    }, english.slug);
    const before = renderToStaticMarkup(<PostPreview post={withoutTranslation} featured />);
    const after = renderToStaticMarkup(<PostPreview post={english} featured />);
    expect(after).toBe(before);
    expect(after).toContain("/blog/security-review");
  });
});
