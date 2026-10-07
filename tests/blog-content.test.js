// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parsePostYaml, serializePost, validatePost, selectPublishedPosts, normalizeInstant } from "@portfolio/blog-content/model";
import { formatPostDate } from "@portfolio/blog-content/format";
import { projectPost, selectPortuguesePosts } from "@portfolio/blog-content/locale";

const draft = (overrides = {}) => validatePost({ status: "draft", ...overrides }, "example");
const published = (overrides = {}, slug = "example") => validatePost({
  title: "Example", summary: "A summary", body: "## Hello\n\nMarkdown.",
  status: "published", publishedAt: "2026-09-27T12:00:00-03:00", ...overrides,
}, slug);

describe("editorial contract", () => {
  it("round trips source Markdown including meaningful whitespace", () => {
    const body = '# Heading\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```js\n  const x = "<script>";\n```\n\nA hard break.  \nNext line.\n';
    const post = draft({ body });
    expect(parsePostYaml(serializePost(post), post.slug).body).toBe(body);
  });
  it("accepts incomplete drafts and defaults new records to draft", () => {
    expect(draft()).toMatchObject({ status: "draft", title: "", body: "", publishedAt: null });
    expect(validatePost({}, "new-draft").status).toBe("draft");
  });
  it("keeps old English records valid and round-trips partial Portuguese Markdown", () => {
    expect(published().pt).toBeUndefined();
    const body = "# Revisão\n\n| A | B |\n| - | - |\n\n```js\n  test();\n```\n";
    const post = published({ pt: { publish: false, title: "Revisão", body } });
    expect(parsePostYaml(serializePost(post), post.slug).pt.body).toBe(body);
    expect(projectPost(post, "pt-BR")).toMatchObject({ title: "Revisão", body, locale: "pt-BR" });
  });
  it("validates approved Portuguese content without blocking partial unapproved drafts", () => {
    const partial = published({ pt: { title: "Título" } });
    expect(selectPortuguesePosts([partial])).toEqual([]);
    expect(() => published({ pt: { publish: true, title: "Título" } })).toThrow(/pt.summary/);
    expect(() => published({ cover: { src: "/media/cover.png", alt: "Cover" }, pt: { publish: true, title: "Título", summary: "Resumo", body: "Corpo" } })).toThrow(/pt.coverAlt/);
  });
  it.each(["Bad Slug", "../secret", "", "bad--slug"])("rejects invalid slug %s", (slug) => {
    expect(() => validatePost({}, slug)).toThrow(/slug/);
  });
  it("identifies every missing publication field", () => {
    try { validatePost({ status: "published" }, "example"); } catch (error) {
      expect(error.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
        "content/posts/example.yaml:title", "content/posts/example.yaml:summary",
        "content/posts/example.yaml:body", "content/posts/example.yaml:publishedAt",
      ]));
      return;
    }
    throw new Error("Invalid publication accepted");
  });
  it("rejects duplicates, mismatched filenames, YAML keys and aliases", () => {
    expect(() => selectPublishedPosts([published(), published()], "2026-10-01T00:00:00Z")).toThrow(/Duplicate slug/);
    expect(() => validatePost({ slug: "different" }, "example")).toThrow(/filename/);
    expect(() => parsePostYaml("title: A\ntitle: B", "example")).toThrow(/YAML/);
    expect(() => parsePostYaml("title: &title Title\nbody: *title", "example")).toThrow(/YAML/);
  });
  it.each(["2026-09-27", "2026-09-27T12:00:00", "2026-02-30T12:00:00Z", "nonsense"])("rejects invalid or ambiguous instant %s", (date) => {
    expect(() => normalizeInstant(date)).toThrow();
  });
  it("normalizes offsets and presents dates in São Paulo", () => {
    expect(normalizeInstant("2026-09-27T12:00:00-03:00")).toBe("2026-09-27T15:00:00.000Z");
    expect(formatPostDate("2026-09-28T01:00:00Z")).toBe("September 27, 2026");
  });
});

describe("publication selector", () => {
  it("keeps one parent article and only adds approved Portuguese versions after the shared cutoff", () => {
    const bilingual = published({ pt: { publish: true, title: "Exemplo", summary: "Resumo", body: "Corpo traduzido" } });
    expect(selectPortuguesePosts(selectPublishedPosts([bilingual], "2026-09-27T14:59:59Z"))).toEqual([]);
    const english = selectPublishedPosts([bilingual], "2026-10-01T00:00:00Z");
    expect(english).toHaveLength(1);
    expect(selectPortuguesePosts(english)).toMatchObject([{ slug: "example", title: "Exemplo", summary: "Resumo", body: "Corpo traduzido" }]);
    expect(selectPortuguesePosts(selectPublishedPosts([published({ pt: { publish: false, title: "Rascunho" } })], "2026-10-01T00:00:00Z"))).toEqual([]);
  });
  it("preserves newest-first ordering and removes only the withdrawn translation", () => {
    const translate = (title, publish = true) => ({ publish, title, summary: "Resumo", body: "Texto em português" });
    const records = [
      published({ pt: translate("Mais antigo"), publishedAt: "2026-09-26T12:00:00Z" }, "older"),
      published({ pt: translate("Mais novo") }, "newer"),
      published({ pt: translate("Retirado", false) }, "withdrawn"),
      published({ status: "draft", pt: translate("Rascunho") }, "draft"),
    ];
    const parents = selectPublishedPosts(records, "2026-10-01T00:00:00Z");
    expect(parents.map((post) => post.slug)).toEqual(["newer", "withdrawn", "older"]);
    expect(selectPortuguesePosts(parents).map((post) => post.slug)).toEqual(["newer", "older"]);
  });
  it("never publishes drafts, or published records with a future date", () => {
    expect(selectPublishedPosts([draft({ publishedAt: "2020-01-01T00:00:00Z" }), published({}, "future")], "2026-09-27T14:59:59Z")).toEqual([]);
  });
  it.each([
    ["2026-09-27T14:59:59.999Z", 0],
    ["2026-09-27T15:00:00.000Z", 1],
    ["2026-09-27T15:00:00.001Z", 1],
  ])("checks scheduled boundary at %s", (cutoff, count) => {
    expect(selectPublishedPosts([published({ status: "scheduled" })], cutoff)).toHaveLength(count);
  });
  it("orders newest first, breaks ties by slug, does not mutate and supports empty", () => {
    const posts = [published({}, "zeta"), published({ publishedAt: "2026-09-26T12:00:00Z" }, "older"), published({}, "alpha")];
    expect(selectPublishedPosts(posts, "2026-10-01T00:00:00Z").map((post) => post.slug)).toEqual(["alpha", "zeta", "older"]);
    expect(posts[0].slug).toBe("zeta");
    expect(selectPublishedPosts([], "2026-10-01T00:00:00Z")).toEqual([]);
  });
  it("does not hide invalid scheduled content just because its date is future", () => {
    expect(() => selectPublishedPosts([{ ...published(), summary: "" }], "2020-01-01T00:00:00Z")).toThrow(/summary/);
  });
});
