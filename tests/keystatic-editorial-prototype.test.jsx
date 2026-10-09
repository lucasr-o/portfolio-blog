// @vitest-environment node
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
// The CMS dependency is workspace-local; this spike intentionally targets its pinned implementation.
import { collection, fields } from "../apps/cms/node_modules/@keystatic/core/dist/keystatic-core.node.js";
import { describe, expect, it } from "vitest";
import { editorialPrototypeField } from "../apps/cms/lib/editorial-field.jsx";

const isolated = collection({
  label: "Editorial prototype", path: "content/prototype/*", slugField: "title", format: "yaml",
  schema: {
    title: fields.slug({
      name: { label: "Initial Portuguese title", validation: { isRequired: true } },
      slug: { label: "Stable URL slug" },
    }),
    editorial: editorialPrototypeField(),
  },
});

describe("Keystatic 0.6.9 isolated editorial field", () => {
  it("keeps a real top-level slug field and renders Portuguese before English", () => {
    expect(isolated.slugField).toBe("title");
    expect(isolated.schema.title.formKind).toBe("slug");
    const state = isolated.schema.editorial.defaultValue();
    const html = renderToStaticMarkup(React.createElement(isolated.schema.editorial.Input, {
      value: state, onChange() {}, autoFocus: false, forceValidation: false,
    }));
    expect(html.indexOf("Português")).toBeLessThan(html.indexOf(">English</h2>"));
    expect(html).not.toContain('type="datetime-local"');
  });

  it("serializes the prepared YAML and media together, then reopens the same Markdown", () => {
    const field = isolated.schema.editorial;
    const initial = field.defaultValue();
    const hash = "a".repeat(64);
    const pending = `/media/__pending__/${hash}.gif`;
    const data = { ...initial.data, status: "published", images: [{ src: pending }],
      pt: { publish: true, summary: "Resumo", body: `## Corpo\n\n![Pepe](${pending})` } };
    const bytes = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
    const state = { ...initial, data, assets: new Map([[`${hash}.gif`, bytes]]) };
    expect(field.validate(state)).toBe(state);
    const saved = field.serialize(state, { slug: "revisao" });
    expect(saved.value.pt.body).toBe(`## Corpo\n\n![Pepe](/media/revisao/${hash}.gif)`);
    expect(saved.value.pt).not.toHaveProperty("publishedAt");
    expect(saved.external.get("content/media").get(`${hash}.gif`)).toEqual(bytes);
    const reopened = field.parse(saved.value, { external: saved.external, other: new Map(), slug: "revisao" });
    expect(reopened.data).toEqual(saved.value);
    expect(reopened.assets.get(`${hash}.gif`)).toEqual(bytes);
  });

  it("edits a migrated English-origin record without changing its slug or legacy date", () => {
    const field = isolated.schema.editorial;
    const original = {
      titleLocale: "en", status: "published", createdAt: "2026-10-01T12:00:00Z",
      en: { publish: true, title: "Review", summary: "Summary", body: "Body", publishedAt: "2026-10-01T12:00:00Z" },
      pt: { publish: false, title: "", summary: "", body: "" },
    };
    const state = field.parse(original, { external: new Map(), other: new Map(), slug: "review" });
    const updated = { ...state.data, pt: { publish: true, title: "Revisão", summary: "Resumo", body: "Corpo" } };
    expect(updated.en.publishedAt).toBe("2026-10-01T12:00:00Z");
    expect(updated.pt).not.toHaveProperty("publishedAt");
    expect(isolated.schema.title.serializeWithSlug({ name: "Review", slug: "review" }).slug).toBe("review");
    expect(field.serialize({ ...state, data: updated }, { slug: "review" }).value.pt.title).toBe("Revisão");
  });

  it("blocks a public Markdown image without meaningful alternative text", () => {
    const field = isolated.schema.editorial;
    const state = field.defaultValue();
    state.data.status = "published";
    state.data.images = [{ src: "/media/review/images/0/src.png" }];
    state.data.pt = {
      publish: true, summary: "Resumo",
      body: "![](/media/review/images/0/src.png)",
    };
    expect(() => field.validate(state)).toThrow(/alt text/);
  });
});
