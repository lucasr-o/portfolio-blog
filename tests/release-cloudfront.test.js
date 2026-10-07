// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReleaseRuntime } from "../scripts/release-cloudfront.mjs";

afterEach(() => vi.unstubAllGlobals());

const asset = { path: "_next/static/example.js", immutable: true, contentType: "text/javascript" };
const manifest = { files: [asset, { path: "pt/blog/index.html" }], posts: ["example"], portuguesePosts: ["example"] };

describe("CloudFront smoke paths", () => {
  it("checks both indexes and an approved Portuguese article", async () => {
    const requested = [];
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const pathname = new URL(url).pathname;
      requested.push(pathname);
      return new Response("ok", { status: pathname.includes("does-not-exist") ? 404 : 200,
        headers: { "content-type": pathname.endsWith(".js") ? "text/javascript" : "text/html" } });
    }));
    const runtime = createReleaseRuntime({ distributionId: "E123456789", domain: "sample.cloudfront.net" });
    await runtime.smoke(manifest);
    expect(requested).toContain("/pt/blog/");
    expect(requested).toContain("/pt/blog/example/");
    expect(requested).toContain("/blog/example/");
  });

  it("rejects wrong content types on Portuguese routes and accepts older releases", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const pathname = new URL(url).pathname;
      return new Response("ok", { status: pathname.includes("does-not-exist") ? 404 : 200,
        headers: { "content-type": pathname.endsWith(".js") ? "text/javascript" : pathname === "/pt/blog/" ? "text/plain" : "text/html" } });
    }));
    const runtime = createReleaseRuntime({ distributionId: "E123456789", domain: "sample.cloudfront.net" });
    await expect(runtime.smoke(manifest)).rejects.toThrow(/pt\/blog/);
    await expect(runtime.smoke({ files: [asset], posts: ["example"] })).resolves.toBeUndefined();
  });

  it("rejects a missing Portuguese article in production", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const pathname = new URL(url).pathname;
      return new Response("ok", { status: pathname === "/pt/blog/example/" ? 404 : 200,
        headers: { "content-type": pathname.endsWith(".js") ? "text/javascript" : "text/html" } });
    }));
    const runtime = createReleaseRuntime({ distributionId: "E123456789", domain: "sample.cloudfront.net" });
    await expect(runtime.smoke(manifest)).rejects.toThrow(/pt\/blog\/example/);
  });
});
