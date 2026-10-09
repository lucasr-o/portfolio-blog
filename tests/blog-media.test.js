// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createMediaManifest, inspectImage, referencedImages } from "@portfolio/blog-content/media";
import { mediaRepositoryPath, validatePost, selectPublishedPosts, MAX_IMAGE_BYTES } from "@portfolio/blog-content/model";
import { selectPortuguesePosts } from "@portfolio/blog-content/locale";
import { readFile } from "node:fs/promises";

const image = { src: "/media/example/photo.png", alt: "A university emblem" };
const article = (overrides = {}, slug = "example") => validatePost({
  status: "published", title: "Example", summary: "Example summary", publishedAt: "2026-09-01T00:00:00Z",
  body: `![${image.alt}](${image.src})`, images: [image], ...overrides,
}, slug);
const png = () => readFile(new URL("../public/brands/ufabc.png", import.meta.url));

describe("editorial media", () => {
  it("hashes valid images deterministically, with dimensions and local source", async () => {
    const bytes = await png();
    const media = await inspectImage(bytes, image.src);
    expect(media).toMatchObject({ width: expect.any(Number), height: expect.any(Number), repositoryPath: "content/media/example/photo.png" });
    expect(media.url).toMatch(/^\/media\/posts\/[a-f0-9]{64}\.png$/);
    expect(await inspectImage(bytes, image.src)).toEqual(media);
  });
  it("accepts a genuine GIF and creates a deterministic still poster", async () => {
    const bytes = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
    const asset = await inspectImage(bytes, "/media/example/loop.gif");
    expect(asset).toMatchObject({ width: 1, height: 1, frames: 1 });
    expect(asset.url).toMatch(/^\/media\/posts\/[a-f0-9]{64}\.gif$/);
    expect(asset.posterUrl).toMatch(/^\/media\/posts\/[a-f0-9]{64}\.png$/);
    expect(await inspectImage(bytes, "/media/example/loop.gif")).toEqual(asset);
    await expect(inspectImage(bytes, "/media/example/loop.png")).rejects.toThrow(/extension/);
    expect(() => article({ cover: { src: "/media/example/loop.gif", alt: "Loop" } })).toThrow(/still/);
  });
  it("blocks a GIF beyond the frame limit and a truncated GIF", async () => {
    const oneFrame = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
    const tooManyFrames = Buffer.concat([
      oneFrame.subarray(0, 13), ...Array(121).fill(oneFrame.subarray(13, -1)), oneFrame.subarray(-1),
    ]);
    await expect(inspectImage(tooManyFrames, "/media/example/too-many.gif")).rejects.toThrow(/120 frames/);
    await expect(inspectImage(oneFrame.subarray(0, 20), "/media/example/broken.gif")).rejects.toThrow(/Invalid/);
  });
  it("rejects invalid, oversized, truncated and mismatched image files", async () => {
    await expect(inspectImage(Buffer.from("not an image"), image.src)).rejects.toThrow(/Invalid/);
    await expect(inspectImage(Buffer.alloc(MAX_IMAGE_BYTES + 1), image.src)).rejects.toThrow(/5 MiB/);
    await expect(inspectImage((await png()).subarray(0, 70), image.src)).rejects.toThrow(/Invalid/);
    await expect(inspectImage(await png(), "/media/photo.jpg")).rejects.toThrow(/extension/);
  });
  it.each(["../secret", "/media/../secret.png", "/media/%2e%2e/a.png", "/media/a.svg", "https://example.com/a.png", "/media/a.png?x=1", "/media/a\\b.png"])("rejects unsafe reference %s", (reference) => {
    expect(() => mediaRepositoryPath(reference)).toThrow();
  });
  it("requires declared images and descriptive alt text", () => {
    expect(() => referencedImages(article({ body: `![](${image.src})` }))).toThrow(/alt text/);
    expect(() => referencedImages(article({ images: [] }))).toThrow(/Images field/);
    expect(() => article({ images: [{ ...image, alt: "" }] })).toThrow(/images\[0\].alt/);
  });
  it("resolves reference-style Markdown and ignores images in code fences", () => {
    expect(referencedImages(article({ body: `![Emblem][logo]\n\n[logo]: ${image.src}\n\n\`\`\`md\n![](https://host/a.png)\n\`\`\`` }))).toEqual([{ src: image.src, alt: "Emblem" }]);
  });
  it("excludes draft-only, future-only and unused media from the publication manifest", async () => {
    const read = vi.fn(png);
    const posts = [article(), article({ status: "draft", body: "![](/media/draft.png)", images: [] }, "draft"), article({ status: "scheduled", publishedAt: "2030-01-01T00:00:00Z", body: "![](/media/future.png)" }, "future")];
    const manifest = await createMediaManifest(selectPublishedPosts(posts, "2026-09-27T00:00:00Z"), read);
    expect(Object.keys(manifest)).toEqual([image.src]);
    expect(read).toHaveBeenCalledExactlyOnceWith("content/media/example/photo.png");
    expect(await createMediaManifest([article({ body: "No images." })], read)).toEqual({});
  });
  it("includes Portuguese-only images only when their translation is approved", async () => {
    const portugueseImage = { src: "/media/example/pt.png", alt: "Imagem compartilhada" };
    const base = {
      body: "English text without an image.", images: [portugueseImage],
      pt: { publish: false, title: "Título", summary: "Resumo", body: `![Imagem em português](${portugueseImage.src})` },
    };
    const reader = vi.fn(png);
    const unpublished = selectPublishedPosts([article(base)], "2026-09-27T00:00:00Z");
    expect(await createMediaManifest([...unpublished, ...selectPortuguesePosts(unpublished)], reader)).toEqual({});
    const published = selectPublishedPosts([article({ ...base, pt: { ...base.pt, publish: true } })], "2026-09-27T00:00:00Z");
    const manifest = await createMediaManifest([...published, ...selectPortuguesePosts(published)], reader);
    expect(Object.keys(manifest)).toEqual([portugueseImage.src]);
    expect(reader).toHaveBeenCalledExactlyOnceWith("content/media/example/pt.png");
    expect(() => referencedImages(selectPortuguesePosts([article({ ...base, pt: { ...base.pt, publish: true, body: `![](${portugueseImage.src})` } })])[0])).toThrow(/pt.body.image/);
  });
  it("uses Portuguese cover alternative text in the translated article", () => {
    const cover = { src: image.src, alt: "English cover description" };
    const [pt] = selectPortuguesePosts([article({ body: "English text", cover, pt: { publish: true, title: "Título", summary: "Resumo", body: "Texto", coverAlt: "Descrição da capa" } })]);
    expect(pt.cover.alt).toBe("Descrição da capa");
    expect(referencedImages(pt)).toEqual([{ src: image.src, alt: "Descrição da capa" }]);
  });
});
