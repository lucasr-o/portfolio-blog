// @vitest-environment node
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { resolveCommitDates } from "@portfolio/blog-content/history";
import { parsePostYaml } from "@portfolio/blog-content/model";
import { ENGLISH, PORTUGUESE, selectLocalizedPosts } from "@portfolio/blog-content/locale";

const run = promisify(execFile);
const roots = [];

async function git(root, args, instant) {
  return run("git", ["-C", root, ...args], {
    env: { ...process.env, ...(instant ? { GIT_AUTHOR_DATE: instant, GIT_COMMITTER_DATE: instant } : {}) },
  });
}

async function repository() {
  const root = await mkdtemp(path.join(os.tmpdir(), "portfolio-blog-history-"));
  roots.push(root);
  await mkdir(path.join(root, "content/posts"), { recursive: true });
  await git(root, ["init", "-q", "-b", "main"]);
  await git(root, ["config", "user.name", "Test Author"]);
  await git(root, ["config", "user.email", "test@example.invalid"]);
  return root;
}

async function save(root, yaml, instant) {
  await writeFile(path.join(root, "content/posts/example.yaml"), yaml);
  await git(root, ["add", "content/posts/example.yaml"]);
  await git(root, ["commit", "-q", "-m", "Save article"], instant);
}

function article({ status = "draft", ptPublish = false, ptBody = "Corpo", enPublish = false } = {}) {
  return `title: Artigo\neditorial:\n  titleLocale: pt\n  status: ${status}\n  pt:\n    publish: ${ptPublish}\n    summary: Resumo\n    body: ${ptBody}\n  en:\n    publish: ${enPublish}\n    title: Article\n    summary: Summary\n    body: Body\n`;
}

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe("dates derived from production Git commits", () => {
  it("keeps creation and first publication stable through edits, withdrawal and later translation", async () => {
    const root = await repository();
    const moments = [
      "2026-10-01T12:00:00Z", "2026-10-02T12:00:00Z", "2026-10-03T12:00:00Z",
      "2026-10-04T12:00:00Z", "2026-10-05T12:00:00Z", "2026-10-15T12:00:00Z",
    ];
    await save(root, article(), moments[0]);
    await save(root, article({ status: "published", ptPublish: true }), moments[1]);
    await save(root, article({ status: "published", ptPublish: true, ptBody: "Corpo editado" }), moments[2]);
    await save(root, article({ status: "draft", ptPublish: true, ptBody: "Corpo editado" }), moments[3]);
    await save(root, article({ status: "published", ptPublish: true, ptBody: "Corpo editado" }), moments[4]);
    await save(root, article({ status: "published", ptPublish: true, ptBody: "Corpo editado", enPublish: true }), moments[5]);
    const current = parsePostYaml(await readFile(path.join(root, "content/posts/example.yaml"), "utf8"), "example");
    expect(current.createdAt).toBeNull();
    expect(current.pt.publishedAt).toBeNull();
    const [resolved] = await resolveCommitDates(root, [current]);
    expect(resolved.createdAt).toBe("2026-10-01T12:00:00.000Z");
    expect(resolved.pt.publishedAt).toBe("2026-10-02T12:00:00.000Z");
    expect(resolved.pt.updatedAt).toBe("2026-10-03T12:00:00.000Z");
    expect(resolved.en.publishedAt).toBe("2026-10-15T12:00:00.000Z");
    expect(selectLocalizedPosts([resolved], moments[5], PORTUGUESE)).toHaveLength(1);
    expect(selectLocalizedPosts([resolved], moments[5], ENGLISH)).toHaveLength(1);
  });

  it("blocks a date-less public record that has never been committed", async () => {
    const root = await repository();
    await save(root, article(), "2026-10-01T12:00:00Z");
    const current = parsePostYaml(article({ status: "published", ptPublish: true }), "example");
    await expect(resolveCommitDates(root, [current])).rejects.toThrow(/No qualifying committed pt publication/);
  });
});
