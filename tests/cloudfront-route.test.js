import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

const code = await readFile(join(process.cwd(), "infra/cloudfront/viewer-request.js"), "utf8");
const edgeHandler = runInNewContext(`${code}\nhandler`, {});
const exportDirectory = join(process.cwd(), "out");

function route(uri, querystring = { feature: { value: "article" } }) {
  const request = { method: "GET", uri, querystring,
    headers: { accept: { value: "text/html" } }, cookies: {} };
  const result = edgeHandler({ request });
  if (result.statusCode) return result;
  expect(result).toBe(request);
  expect(result.querystring).toBe(querystring);
  expect(result.headers.accept.value).toBe("text/html");
  return result.uri;
}

async function filesUnder(directory, prefix = "") {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesUnder(path, `${prefix}${entry.name}/`));
    else output.push(`${prefix}${entry.name}`);
  }
  return output;
}

describe("CloudFront viewer request routing", () => {
  it("resolves actual exported pages with and without the canonical trailing slash", async () => {
    const inventory = new Set(await filesUnder(exportDirectory));
    for (const page of ["index.html", "blog/index.html",
      "blog/security-reviews-that-move-at-product-speed/index.html"]) {
      expect(inventory.has(page)).toBe(true);
      const path = page === "index.html" ? "/" : `/${page.slice(0, -"index.html".length)}`;
      expect(route(path)).toBe(`/${page}`);
      if (path !== "/") expect(route(path.slice(0, -1))).toBe(`/${page}`);
    }
    expect(route("/blog/nonexistent/")).toBe("/blog/nonexistent/index.html");
    expect(inventory.has("blog/nonexistent/index.html")).toBe(false);
  });

  it("preserves every exported file path, including Next navigation payloads and media", async () => {
    const inventory = await filesUnder(exportDirectory);
    expect(inventory.some((path) => path.endsWith(".txt"))).toBe(true);
    expect(inventory.some((path) => path.startsWith("_next/static/"))).toBe(true);
    expect(inventory.some((path) => path.startsWith("media/posts/"))).toBe(true);
    for (const file of inventory) expect(route(`/${file}`)).toBe(`/${file}`);
  });

  it("rejects traversal, ambiguous encodings and administrative paths", () => {
    for (const uri of ["/../state", "/blog/./post", "/blog//post", "/blog/%2e%2e/state",
      "/blog/%252e%252e/state", "/blog/..\\state", "/blog/?oops", "/blog/#oops",
      "/state/current-release.json", "/releases/old/index.html", "/api/health",
      "/preview/post", "/keystatic", "/content/posts/secret.yaml", "/apps/cms/.env"]) {
      expect(route(uri).statusCode, uri).toBe(400);
    }
  });
});
