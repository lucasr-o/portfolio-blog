// @vitest-environment node
import { describe, expect, it } from "vitest";
import { migrateLegacyRecord } from "@portfolio/blog-content/migration";
import { parsePostYaml } from "@portfolio/blog-content/model";

const commit = "2026-10-09T15:30:00-03:00";
const pin = "2026-10-09T15:00:00-03:00";

describe("read-only editorial migration", () => {
  it("preserves bilingual public projections and reviewed legacy date pins", () => {
    const legacy = parsePostYaml(`
title: Review
summary: Summary
body: "![Pepe](/media/review/images/0/src.png)"
status: published
publishedAt: '${pin}'
author: Lucas
images:
  - src: /media/review/images/0/src.png
    alt: Pepe
pt:
  publish: true
  title: Revisão
  summary: Resumo
  body: "![Pepe](/media/review/images/0/src.png)"
`, "review");
    const converted = migrateLegacyRecord(legacy, commit);
    expect(converted.comparisons.every((entry) => entry.unchanged)).toBe(true);
    expect(converted.yaml).toContain("titleLocale: en");
    expect(converted.post.en.publishedAt).toBe("2026-10-09T18:00:00.000Z");
    expect(converted.post.pt.publishedAt).toBe("2026-10-09T18:00:00.000Z");
    expect(converted.post.createdAt).toBe("2026-10-09T18:00:00.000Z");
    expect(converted.post.images[0].src).toBe("/media/review/images/0/src.png");
  });

  it("does not carry future schedule-like timestamps from a draft", () => {
    const legacy = parsePostYaml(`
title: Draft
summary: In progress
body: Text
status: draft
publishedAt: '2026-11-01T12:00:00Z'
updatedAt: '2026-11-02T12:00:00Z'
`, "draft");
    const converted = migrateLegacyRecord(legacy, commit);
    expect(converted.droppedDraftDates).toBe(true);
    expect(converted.yaml).not.toContain("publishedAt:");
    expect(converted.yaml).not.toContain("updatedAt:");
    expect(converted.post.en.publish).toBe(false);
  });

  it("blocks scheduled legacy content for explicit editorial review", () => {
    const legacy = parsePostYaml(`
title: Scheduled
summary: Later
body: Text
status: scheduled
publishedAt: '2026-11-01T12:00:00Z'
`, "scheduled");
    expect(() => migrateLegacyRecord(legacy, commit)).toThrow(/scheduled; review/);
  });
});
