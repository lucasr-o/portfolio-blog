import { describe, expect, it } from "vitest";
import { shouldDeploy } from "../scripts/release-preflight.mjs";

const sha = "a".repeat(40);
const cutoff = "2026-09-28T00:00:00.000Z";
const current = { schema: 1, sourceRevision: sha, publicationTime: cutoff,
  releaseId: `${sha}-1-1`, manifest: { schema: 1, sourceRevision: sha,
    publicationTime: cutoff, releaseId: `${sha}-1-1`, posts: ["ready"],
    files: [], mutableKeys: [] } };

describe("scheduled release preflight", () => {
  it("skips an unchanged schedule without a build or public mutation", () => {
    expect(shouldDeploy({ eventName: "schedule", sourceRevision: sha,
      eligibleSlugs: ["ready"], current })).toBe(false);
  });
  it("runs for newly due content or a changed commit, and main pushes always run", () => {
    expect(shouldDeploy({ eventName: "schedule", sourceRevision: sha,
      eligibleSlugs: ["ready", "new"], current })).toBe(true);
    expect(shouldDeploy({ eventName: "schedule", sourceRevision: "b".repeat(40),
      eligibleSlugs: ["ready"], current })).toBe(true);
    expect(shouldDeploy({ eventName: "push", sourceRevision: sha,
      eligibleSlugs: ["ready"], current })).toBe(true);
    expect(shouldDeploy({ eventName: "schedule", sourceRevision: sha,
      eligibleSlugs: ["ready"], current: null })).toBe(true);
  });
  it("does not treat invalid state or an unsupported event as no change", () => {
    expect(() => shouldDeploy({ eventName: "schedule", sourceRevision: sha,
      eligibleSlugs: [], current: {} })).toThrow();
    expect(() => shouldDeploy({ eventName: "pull_request", sourceRevision: sha,
      eligibleSlugs: [], current })).toThrow();
  });
});
