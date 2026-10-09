import { describe, expect, it } from "vitest";
import { shouldDeploy } from "../scripts/release-preflight.mjs";
import { classifySiteFile } from "../scripts/release-plan.mjs";

const sha = "a".repeat(40);
const fingerprint = "f".repeat(64);
const cutoff = "2026-09-28T00:00:00.000Z";
const articlePath = "blog/ready/index.html";
const articleFile = { path: articlePath, key: `site/${articlePath}`, sha256: "b".repeat(64), bytes: 0,
  ...classifySiteFile(articlePath) };
const current = { schema: 1, sourceRevision: sha, publicationTime: cutoff,
  releaseId: `${sha}-1-1`, manifest: { schema: 1, sourceRevision: sha,
    publicationTime: cutoff, releaseId: `${sha}-1-1`, posts: ["ready"], publicFingerprint: fingerprint,
    files: [articleFile], mutableKeys: [articleFile.key] } };

describe("push-driven release preflight", () => {
  it("skips an unchanged draft-only push without a build or public mutation", () => {
    expect(shouldDeploy({ eventName: "push", fingerprint, current })).toBe(false);
  });
  it("deploys public changes, legacy state, first release and manual recovery", () => {
    expect(shouldDeploy({ eventName: "push", fingerprint: "b".repeat(64), current })).toBe(true);
    expect(shouldDeploy({ eventName: "push", fingerprint, current: null })).toBe(true);
    expect(shouldDeploy({ eventName: "push", fingerprint, current: {
      ...current, manifest: { ...current.manifest, publicFingerprint: undefined },
    } })).toBe(true);
    expect(shouldDeploy({ eventName: "workflow_dispatch", fingerprint, current })).toBe(true);
  });
  it("does not treat invalid state or an unsupported event as no change", () => {
    expect(() => shouldDeploy({ eventName: "push", fingerprint, current: {} })).toThrow();
    expect(() => shouldDeploy({ eventName: "schedule", fingerprint, current })).toThrow();
    expect(() => shouldDeploy({ eventName: "push", fingerprint: "bad", current })).toThrow();
  });
});
