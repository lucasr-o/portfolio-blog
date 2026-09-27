// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createMediaManifest, inspectImage, referencedImages } from "@portfolio/blog-content/media";
import { mediaRepositoryPath, validatePost, selectPublishedPosts, MAX_IMAGE_BYTES } from "@portfolio/blog-content/model";
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
});
