// @vitest-environment node
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { computePublicFingerprint } from "../scripts/public-fingerprint.mjs";

const run = promisify(execFile);
const roots = [];
const publication = { posts: [], ptPosts: [], media: {} };

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe("public-output fingerprint", () => {
  it("ignores draft-only edits but notices public content, media and unknown code", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "portfolio-blog-fingerprint-"));
    roots.push(root);
    await mkdir(path.join(root, "content/posts"), { recursive: true });
    await mkdir(path.join(root, "docs"), { recursive: true });
    await writeFile(path.join(root, "app.js"), "export const page = 1;\n");
    await writeFile(path.join(root, "content/posts/draft.yaml"), "status: draft\n");
    await writeFile(path.join(root, "docs/notes.md"), "notes\n");
    await run("git", ["-C", root, "init", "-q"]);
    await run("git", ["-C", root, "add", "."]);
    const first = await computePublicFingerprint(root, publication);
    await writeFile(path.join(root, "content/posts/draft.yaml"), "status: draft\nbody: more text\n");
    await writeFile(path.join(root, "docs/notes.md"), "more notes\n");
    expect(await computePublicFingerprint(root, publication)).toBe(first);
    const published = { ...publication, posts: [{ slug: "hello", body: "Public body", publishedAt: "2026-10-01T00:00:00Z" }] };
    expect(await computePublicFingerprint(root, published)).not.toBe(first);
    const withMedia = { ...published, media: { "/media/hello/image.gif": {
      hash: "a".repeat(64), posterHash: "b".repeat(64), width: 100, height: 100,
    } } };
    expect(await computePublicFingerprint(root, withMedia)).not.toBe(await computePublicFingerprint(root, published));
    expect(await computePublicFingerprint(root, { ...published, posts: [] })).toBe(first);
    await writeFile(path.join(root, "app.js"), "export const page = 2;\n");
    expect(await computePublicFingerprint(root, publication)).not.toBe(first);
  });
});
