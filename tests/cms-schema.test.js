// @vitest-environment node
import { describe, expect, it } from "vitest";
import config from "../apps/cms/keystatic.config.js";

describe("CMS schema", () => {
  const { schema } = config.collections.posts;
  it("limits editing to the blog in the intended GitHub repository outside development", () => {
    expect(Object.keys(config.collections)).toEqual(["posts"]);
    expect(config.singletons).toBeUndefined();
    expect(config.storage).toEqual({ kind: "github", repo: "lucasr-o/portfolio-blog" });
    expect(config.collections.posts.format).toBe("yaml");
    expect(schema.status.defaultValue()).toBe("draft");
  });
  it("serializes date offsets as UTC, leaving incomplete draft dates empty", () => {
    expect(schema.publishedAt.serialize("2026-10-01T09:00:00-03:00").value).toBe("2026-10-01T12:00:00.000Z");
    expect(schema.publishedAt.serialize("").value).toBeUndefined();
    expect(() => schema.publishedAt.serialize("2026-02-30T12:00:00Z")).toThrow(/calendar/);
  });
  it("stores Markdown as text instead of a document/contentField", () => {
    const body = "## Source\n\n```js\n  const x = 1;\n```\n";
    expect(schema.body.serialize(body).value).toBe(body);
  });
});
