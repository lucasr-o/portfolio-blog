import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DIGEST_IMAGE, updateCms } from "../ops/cms/update-plan.mjs";

const oldImage = `ghcr.io/lucasr-o/portfolio-blog-cms@sha256:${"a".repeat(64)}`;
const newImage = `ghcr.io/lucasr-o/portfolio-blog-cms@sha256:${"b".repeat(64)}`;
const head = "c".repeat(40);

function fixture(overrides = {}) {
  const calls = [];
  const options = {
    currentImage: oldImage,
    candidateImage: newImage,
    readMainHead: async () => { calls.push("head"); return head; },
    pull: async (image) => { calls.push(`pull:${image}`); },
    inspect: async (image) => {
      calls.push(`inspect:${image}`);
      return { architecture: "arm64", source: "https://github.com/lucasr-o/portfolio-blog", revision: head };
    },
    apply: async (image) => { calls.push(`apply:${image}`); },
    healthy: async () => { calls.push("health"); return true; },
    rememberFailure: async (image) => { calls.push(`failed:${image}`); },
    ...overrides,
  };
  return { calls, options };
}

test("only the dedicated repository's digest images are accepted", async () => {
  assert.equal(DIGEST_IMAGE.test(oldImage), true);
  for (const candidateImage of [
    "ghcr.io/lucasr-o/portfolio-blog-cms:latest",
    `ghcr.io/lucasr-o/other-cms@sha256:${"b".repeat(64)}`,
    `ghcr.io/other/portfolio-blog-cms@sha256:${"b".repeat(64)}`,
  ]) {
    const { calls, options } = fixture({ candidateImage });
    await assert.rejects(updateCms(options), /only this project's image/);
    assert.deepEqual(calls, []);
  }
});

test("unchanged or previously failed candidate never applies", async () => {
  for (const [overrides, status] of [
    [{ candidateImage: oldImage }, "unchanged"],
    [{ failedImage: newImage }, "previously-failed"],
  ]) {
    const { calls, options } = fixture(overrides);
    assert.equal((await updateCms(options)).status, status);
    assert.deepEqual(calls, []);
  }
});

test("approved arm64 main revision updates and passes health", async () => {
  const { calls, options } = fixture();
  assert.deepEqual(await updateCms(options), { status: "updated", image: newImage, revision: head });
  assert.deepEqual(calls, ["head", `pull:${newImage}`, `inspect:${newImage}`, "head", `apply:${newImage}`, "health"]);
});

test("network failure or unapproved labels never replaces the running CMS", async () => {
  for (const overrides of [
    { pull: async () => { throw new Error("network unavailable"); } },
    { inspect: async () => ({ architecture: "amd64", source: "https://github.com/lucasr-o/portfolio-blog", revision: head }) },
    { inspect: async () => ({ architecture: "arm64", source: "https://github.com/another/repo", revision: head }) },
    { inspect: async () => ({ architecture: "arm64", source: "https://github.com/lucasr-o/portfolio-blog", revision: "d".repeat(40) }) },
    { readMainHead: (() => { let count = 0; return async () => ++count === 1 ? head : "d".repeat(40); })() },
  ]) {
    const { calls, options } = fixture(overrides);
    await assert.rejects(updateCms(options));
    assert.equal(calls.some((call) => call.startsWith("apply:") || call.startsWith("failed:")), false);
  }
});

test("failed candidate health records digest and restores the previous image", async () => {
  let checks = 0;
  const { calls, options } = fixture({ healthy: async () => { calls.push("health"); return ++checks > 1; } });
  await assert.rejects(updateCms(options), /previous image was restored/);
  assert.deepEqual(calls.slice(-5), [`apply:${newImage}`, "health", `failed:${newImage}`, `apply:${oldImage}`, "health"]);
});

test("failure while starting a candidate still attempts previous digest, and recovery failure is explicit", async () => {
  const { calls, options } = fixture({
    apply: async (image) => {
      calls.push(`apply:${image}`);
      if (image === newImage) throw new Error("container could not start");
    },
  });
  await assert.rejects(updateCms(options), /previous image was restored/);
  assert.deepEqual(calls.slice(-4), [`apply:${newImage}`, `failed:${newImage}`, `apply:${oldImage}`, "health"]);

  const broken = fixture({ healthy: async () => false });
  await assert.rejects(updateCms(broken.options), AggregateError);
  assert.equal(broken.calls.includes(`apply:${oldImage}`), true);
});

test("the host updater pins Compose to this project's file and only recreates cms", async () => {
  const source = await readFile(new URL("../ops/cms/update-cms.mjs", import.meta.url), "utf8");
  assert.match(source, /const composeArgs = \["compose", "--project-directory", root,/);
  assert.match(source, /-f", path\.join\(root, "compose\.yml"\)/);
  assert.match(source, /"up", "-d", "--no-deps", "cms"/);
  assert.match(source, /config\.name !== "portfolio-blog-cms"/);
  assert.doesNotMatch(source, /"down"|"system"|"prune"|"rm"/);
});
