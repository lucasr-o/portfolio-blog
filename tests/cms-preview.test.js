// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { validatePost } from "@portfolio/blog-content/model";
import { markdownImageReference, openGitHubSnapshot, preparePreview, readPreviewImage } from "../apps/cms/lib/github-preview.js";

const revision = "a".repeat(40), treeSha = "b".repeat(40), blobSha = "c".repeat(40);
const yaml = "title: A saved draft\nstatus: draft\nbody: '**Hello** from GitHub'\n";
function githubFixture(overrides = {}) {
  const routes = {
    "/user": { login: "lucasr-o" },
    "/repos/lucasr-o/portfolio-blog": { full_name: "lucasr-o/portfolio-blog", permissions: { push: true } },
    "/repos/lucasr-o/portfolio-blog/commits/main": { sha: revision, commit: { tree: { sha: treeSha } } },
    [`/repos/lucasr-o/portfolio-blog/git/trees/${treeSha}?recursive=1`]: { tree: [{ path: "content/posts/saved-draft.yaml", type: "blob", mode: "100644", sha: blobSha, size: Buffer.byteLength(yaml) }] },
    [`/repos/lucasr-o/portfolio-blog/git/blobs/${blobSha}`]: { encoding: "base64", content: Buffer.from(yaml).toString("base64") },
    ...overrides,
  };
  return vi.fn(async (url) => {
    const route = routes[url.replace("https://api.github.com", "")];
    if (route === undefined) throw new Error(`Unexpected API target: ${url}`);
    return route instanceof Response ? route : Response.json(route);
  });
}

describe("saved GitHub previews", () => {
  it("reads the current main revision and does not cache authenticated responses", async () => {
    const fetcher = githubFixture();
    const snapshot = await openGitHubSnapshot("test-only-token", { fetcher });
    expect(snapshot.revision).toBe(revision);
    expect(snapshot.slugs).toEqual(["saved-draft"]);
    expect((await snapshot.readPost("saved-draft")).body).toBe("**Hello** from GitHub");
    for (const [url, options] of fetcher.mock.calls) {
      expect(url.startsWith("https://api.github.com/")).toBe(true);
      expect(options).toMatchObject({ cache: "no-store", redirect: "error" });
    }
  });
  it("does not expose public-repository drafts without an authorized owner session", async () => {
    const fetcher = githubFixture();
    await expect(openGitHubSnapshot(undefined, { fetcher })).rejects.toMatchObject({ status: 401 });
    expect(fetcher).not.toHaveBeenCalled();
    await expect(openGitHubSnapshot("test-only-token", { fetcher: githubFixture({ "/user": { login: "someone-else" } }) })).rejects.toMatchObject({ status: 403 });
    await expect(openGitHubSnapshot("test-only-token", { fetcher: githubFixture({ "/repos/lucasr-o/portfolio-blog": { full_name: "lucasr-o/portfolio-blog", permissions: { push: false } } }) })).rejects.toMatchObject({ status: 403 });
  });
  it.each([401, 403, 500])("fails closed when GitHub responds %s", async (status) => {
    await expect(openGitHubSnapshot("test-only-token", { fetcher: githubFixture({ "/user": new Response(null, { status }) }) })).rejects.toMatchObject({ status: status === 500 ? 502 : 401 });
  });
  it("rejects arbitrary revision, slug, media path and truncated trees", async () => {
    const fetcher = githubFixture();
    await expect(openGitHubSnapshot("test-only-token", { revision: "../../another/repo", fetcher })).rejects.toMatchObject({ status: 400 });
    const snapshot = await openGitHubSnapshot("test-only-token", { fetcher });
    await expect(snapshot.readPost("../README")).rejects.toMatchObject({ status: 400 });
    await expect(snapshot.readImage("https://example.com/file.png")).rejects.toThrow(/local/);
    await expect(openGitHubSnapshot("test-only-token", { fetcher: githubFixture({ [`/repos/lucasr-o/portfolio-blog/git/trees/${treeSha}?recursive=1`]: { truncated: true, tree: [] } }) })).rejects.toMatchObject({ status: 422 });
  });
  it("rejects symlinks and files above the article size limit", async () => {
    for (const entry of [{ mode: "120000", size: 1 }, { mode: "100644", size: 2 * 1024 * 1024 }]) {
      const fetcher = githubFixture({ [`/repos/lucasr-o/portfolio-blog/git/trees/${treeSha}?recursive=1`]: { tree: [{ path: "content/posts/saved-draft.yaml", type: "blob", sha: blobSha, ...entry }] } });
      await expect((await openGitHubSnapshot("test-only-token", { fetcher })).readPost("saved-draft")).rejects.toMatchObject({ status: 422 });
    }
  });
  it("renders incomplete drafts with publication issues and private revision-bound media", async () => {
    const bytes = await readFile(new URL("../content/media/markdown-demo/ufabc.png", import.meta.url));
    const image = { src: "/media/example.png", alt: "Example [image]" };
    const post = validatePost({ status: "draft", body: `![Example](${image.src})`, images: [image] }, "saved-draft");
    const snapshot = { revision, readPost: async () => post, readImage: async () => bytes };
    const preview = await preparePreview(snapshot, "saved-draft");
    expect(preview.issues.map(({ path }) => path)).toContain("content/posts/saved-draft.yaml:title");
    expect(preview.media[image.src].url).toMatch(new RegExp(`^/preview/media/${revision}/saved-draft/[a-f0-9]{64}\\.png$`));
    expect(markdownImageReference(image)).toBe("![Example \\[image\\]](/media/example.png)");
    expect(await readPreviewImage(snapshot, "saved-draft", preview.media[image.src].url.split("/").at(-1))).toEqual(bytes);
    await expect(readPreviewImage(snapshot, "saved-draft", `${"0".repeat(64)}.png`)).rejects.toMatchObject({ status: 404 });
    await expect(readPreviewImage(snapshot, "saved-draft", "../secret")).rejects.toMatchObject({ status: 400 });
  });
  it("previews partial Portuguese Markdown from the same saved revision without approving it", async () => {
    const bytes = await readFile(new URL("../content/media/markdown-demo/ufabc.png", import.meta.url));
    const image = { src: "/media/example.png", alt: "English alt" };
    const post = validatePost({
      title: "English article", summary: "English summary", body: "English body", status: "published",
      publishedAt: "2026-09-18T12:00:00Z", images: [image],
      pt: { publish: false, title: "Artigo em português", body: `![Emblema](${image.src})\n\n## Seção` },
    }, "saved-draft");
    const preview = await preparePreview({ revision, readPost: async () => post, readImage: async () => bytes }, "saved-draft");
    expect(preview.revision).toBe(revision);
    expect(preview.ptPost).toMatchObject({ title: "Artigo em português", locale: "pt-BR" });
    expect(preview.ptIssues.map(({ path }) => path)).toContain("content/posts/saved-draft.yaml:pt.summary");
    expect(preview.media[image.src].url).toContain(`/preview/media/${revision}/saved-draft/`);
    expect(preview.issues).toEqual([]);
  });
});
