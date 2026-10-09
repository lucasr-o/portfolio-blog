// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parsePostYaml, serializePost, validatePost } from "@portfolio/blog-content/model";

const first = "2026-10-01T12:00:00Z";
const later = "2026-10-15T12:00:00Z";

describe("localized article schema compatibility", () => {
  it("reads and round-trips a wrapped Portuguese-first article without English", () => {
    const post = validatePost({
      title: "Revisão",
      editorial: {
        titleLocale: "pt", createdAt: first, status: "published",
        pt: { publish: true, summary: "Resumo", body: "## Corpo\n", publishedAt: first },
      },
    }, "revisao");
    expect(post.pt.title).toBe("Revisão");
    expect(post.en).toBeNull();
    const yaml = serializePost(post);
    expect(yaml).toContain("editorial:");
    expect(yaml).not.toContain("\nen:");
    expect(parsePostYaml(yaml, post.slug)).toEqual(post);
  });

  it("never uses a migrated English root title as a Portuguese fallback", () => {
    const migrated = {
      title: "Review",
      editorial: {
        titleLocale: "en", createdAt: first, status: "published",
        en: { publish: true, summary: "Summary", body: "Body", publishedAt: first },
        pt: { publish: false, summary: "Resumo", body: "Corpo" },
      },
    };
    const post = validatePost(migrated, "review");
    expect(post.en.title).toBe("Review");
    expect(post.pt.title).toBe("");
    expect(() => validatePost({
      ...migrated,
      editorial: { ...migrated.editorial, pt: { ...migrated.editorial.pt, publish: true, publishedAt: later } },
    }, "review")).toThrow(/editorial\.pt\.title/);
  });

  it("keeps a bilingual wrapped record's dates, Markdown and indexed image path", () => {
    const image = "/media/review/images/0/src.png";
    const post = validatePost({
      title: "Review",
      editorial: {
        titleLocale: "en", createdAt: first, status: "published",
        images: [{ src: image, alt: "Pepe" }],
        en: { publish: true, summary: "Summary", body: `![Pepe](${image})`, publishedAt: first },
        pt: { publish: true, title: "Revisão", summary: "Resumo", body: `![Pepe](${image})`, publishedAt: later },
      },
    }, "review");
    expect(post.images[0].src).toBe(image);
    expect(post.en.publishedAt).toBe("2026-10-01T12:00:00.000Z");
    expect(post.pt.publishedAt).toBe("2026-10-15T12:00:00.000Z");
    expect(parsePostYaml(serializePost(post), "review")).toEqual(post);
  });

  it("accepts an incomplete wrapped draft but rejects a published version without its body", () => {
    const record = {
      title: "Rascunho",
      editorial: { titleLocale: "pt", createdAt: first, status: "draft", pt: { publish: false, summary: "Em andamento" } },
    };
    expect(validatePost(record, "rascunho").pt.title).toBe("Rascunho");
    expect(() => validatePost({
      ...record,
      editorial: { ...record.editorial, status: "published", pt: { ...record.editorial.pt, publish: true, publishedAt: first } },
    }, "rascunho")).toThrow(/editorial\.pt\.body/);
  });

  it("rejects unknown wrapped fields and an unmarked title origin", () => {
    expect(() => validatePost({ title: "Post", editorial: { createdAt: first } }, "post"))
      .toThrow(/editorial\.titleLocale/);
    expect(() => validatePost({ title: "Post", editorial: { titleLocale: "pt", createdAt: first, unexpected: true } }, "post"))
      .toThrow(/editorial\.unexpected/);
  });

  it("reads a Portuguese-first article without requiring English", () => {
    const post = validatePost({
      createdAt: first,
      status: "published",
      pt: { publish: true, title: "Revisão", summary: "Resumo", body: "## Corpo\n", publishedAt: first },
    }, "revisao");
    expect(post.en).toBeNull();
    expect(post.pt.publishedAt).toBe("2026-10-01T12:00:00.000Z");
    expect(parsePostYaml(serializePost(post), post.slug)).toEqual(post);
  });

  it("retains independent first-publication dates and shared media references", () => {
    const post = validatePost({
      createdAt: first, status: "published",
      images: [{ src: "/media/example/images/0/src.png" }],
      pt: { publish: true, title: "Revisão", summary: "Resumo", body: "![Foto](/media/example/images/0/src.png)", publishedAt: first },
      en: { publish: true, title: "Review", summary: "Summary", body: "![Photo](/media/example/images/0/src.png)", publishedAt: later },
    }, "review");
    expect(post.en.publishedAt).toBe("2026-10-15T12:00:00.000Z");
    expect(post.pt.publishedAt).toBe("2026-10-01T12:00:00.000Z");
    expect(post.images[0].src).toBe("/media/example/images/0/src.png");
  });

  it("keeps English-first legacy records readable without changing their URL or timestamp", () => {
    const legacy = parsePostYaml(`title: Review\nsummary: Summary\nbody: Body\nstatus: published\npublishedAt: '${first}'\npt:\n  publish: true\n  title: Revisão\n  summary: Resumo\n  body: Corpo\n`, "review");
    expect(legacy.slug).toBe("review");
    expect(legacy.title).toBe("Review");
    expect(legacy.publishedAt).toBe("2026-10-01T12:00:00.000Z");
    expect(legacy.pt.publish).toBe(true);
  });

  it("allows incomplete localized drafts but rejects incomplete public versions", () => {
    expect(validatePost({ createdAt: first, status: "draft", pt: { title: "Rascunho" } }, "draft").pt.title).toBe("Rascunho");
    expect(() => validatePost({ createdAt: first, status: "published", pt: { publish: true, title: "Incompleto" } }, "incomplete"))
      .toThrow(/pt.summary/);
    expect(() => validatePost({ createdAt: first, status: "published" }, "empty"))
      .toThrow(/Approve at least one/);
  });

  it("rejects Scheduled in the new schema while retaining old records for migration", () => {
    expect(() => validatePost({ createdAt: first, status: "scheduled" }, "new-record")).toThrow(/draft or published/);
    expect(validatePost({ title: "Old", summary: "Summary", body: "Body", status: "scheduled", publishedAt: first }, "old-record").status)
      .toBe("scheduled");
  });
});
