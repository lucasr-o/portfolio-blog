import React, { useState } from "react";
import { webcrypto, createHash } from "node:crypto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { editorialPrototypeField } from "../apps/cms/lib/editorial-field.jsx";
import { imageExtension, insertMarkdownImage, materializeInlineMedia, reconcileInlineAssets, stageInlineImage } from "../apps/cms/lib/inline-media.js";

const gif = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
const browserGif = () => new Uint8Array(gif);

beforeAll(() => vi.stubGlobal("crypto", webcrypto));

describe("direct Markdown media authoring", () => {
  it("uses real bytes for a stable GIF reference and rejects remote/SVG or empty alt", async () => {
    const staged = await stageInlineImage(browserGif(), async (bytes) => createHash("sha256").update(bytes).digest());
    expect(staged.filename).toMatch(/^[a-f0-9]{64}\.gif$/);
    expect(imageExtension(browserGif())).toBe("gif");
    expect(insertMarkdownImage("before after", 7, 12, "Pepe", staged.src)).toBe(`before ![Pepe](${staged.src})`);
    expect(() => insertMarkdownImage("", 0, 0, "", staged.src)).toThrow(/description/);
    expect(() => insertMarkdownImage("", 0, 0, "Alt", "https://example.com/x.gif")).toThrow(/description/);
    expect(() => imageExtension(new Uint8Array(Buffer.from("<svg></svg>")))).toThrow();
  });

  it("keeps browser-local drafts intact and materializes safe paths only when the slug is known", async () => {
    const staged = await stageInlineImage(browserGif());
    const draft = { pt: { body: `![Pepe](${staged.src})` }, images: [{ src: staged.src }] };
    const assets = new Map([[staged.filename, browserGif()]]);
    expect(materializeInlineMedia(draft, assets, undefined)).toEqual(draft);
    const saved = materializeInlineMedia(draft, assets, "pepe-post");
    expect(saved.pt.body).toContain(`/media/pepe-post/${staged.filename}`);
    expect(saved.images[0].src).toBe(`/media/pepe-post/${staged.filename}`);
    expect(draft.pt.body).toContain("__pending__");
    expect(() => materializeInlineMedia(draft, new Map(), "pepe-post")).toThrow(/not attached/);
  });

  it("retries a missing asset, deduplicates reuse across languages, and removes unused new media", async () => {
    const staged = await stageInlineImage(browserGif());
    const draft = {
      pt: { body: `![Pepe](${staged.src})` },
      en: { body: `![Pepe](${staged.src})` },
      images: [{ src: staged.src }],
    };
    const field = editorialPrototypeField();
    expect(() => field.serialize({ data: draft, assets: new Map() }, { slug: "pepe-post" })).toThrow(/not attached/);
    const assets = new Map([[staged.filename, browserGif()]]);
    const saved = field.serialize({ data: draft, assets }, { slug: "pepe-post" });
    expect(saved.external.get("content/media").size).toBe(1);
    expect(saved.value.en.body).toContain(`/media/pepe-post/${staged.filename}`);
    const removedPortuguese = { ...saved.value, pt: { body: "No image here" } };
    expect(reconcileInlineAssets(removedPortuguese, assets, "pepe-post").assets.size).toBe(1);
    const removedEverywhere = { ...removedPortuguese, en: { body: "No image here either" } };
    const cleaned = reconcileInlineAssets(removedEverywhere, assets, "pepe-post");
    expect(cleaned.assets.size).toBe(0);
    expect(cleaned.data.images).toEqual([]);
  });

  it("pastes a GIF at the cursor and saves Markdown plus bytes in one field result", async () => {
    const field = editorialPrototypeField();
    let latest;
    function Editor() {
      const [value, setValue] = useState(field.defaultValue());
      latest = value;
      return <field.Input value={value} onChange={setValue} autoFocus={false} forceValidation={false} />;
    }
    render(<Editor />);
    const textarea = screen.getAllByLabelText("Markdown", { selector: "textarea" })[0];
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    textarea.setSelectionRange(6, 6);
    const file = { name: "hello.gif", arrayBuffer: async () => gif.buffer.slice(gif.byteOffset, gif.byteOffset + gif.byteLength) };
    fireEvent.paste(textarea, { clipboardData: { items: [{ getAsFile: () => file }] } });
    fireEvent.change(screen.getByLabelText("Texto alternativo"), { target: { value: "Pepe" } });
    fireEvent.click(screen.getByRole("button", { name: "Inserir no cursor" }));
    await waitFor(() => expect(screen.queryByLabelText("Texto alternativo")).not.toBeInTheDocument());
    expect(latest.data.pt.body).toMatch(/^Hello !\[Pepe\]\(\/media\/__pending__\/[a-f0-9]{64}\.gif\)world$/);
    expect(latest.data.images).toHaveLength(1);
    const saved = field.serialize(latest, { slug: "hello-world" });
    expect(saved.value.pt.body).toContain("/media/hello-world/");
    expect(saved.external.get("content/media").size).toBe(1);
    expect([...saved.external.get("content/media").values().next().value]).toEqual([...gif]);
  });
});
