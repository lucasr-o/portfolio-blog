import { describe, expect, it } from "vitest";
import { withPublicCmsOrigin } from "../apps/cms/lib/public-origin.js";

describe("public CMS origin", () => {
  it("pins OAuth requests to the configured HTTPS host without losing the query", () => {
    const request = new Request("http://0.0.0.0:3000/api/keystatic/github/login?from=%2Fkeystatic", {
      headers: { Host: "attacker.invalid", Cookie: "session=test" },
    });
    const fixed = withPublicCmsOrigin(request, "0123456789abcdef.lucas-reis.com");
    expect(fixed.url).toBe("https://0123456789abcdef.lucas-reis.com/api/keystatic/github/login?from=%2Fkeystatic");
    expect(fixed.headers.get("cookie")).toBe("session=test");
  });

  it("preserves POST bodies for Keystatic saves", async () => {
    const request = new Request("http://0.0.0.0:3000/api/keystatic/update", {
      method: "POST", body: "example-body",
    });
    const fixed = withPublicCmsOrigin(request, "0123456789abcdef.lucas-reis.com");
    expect(fixed.method).toBe("POST");
    expect(await fixed.text()).toBe("example-body");
  });

  it("rejects an unapproved hostname", () => {
    const request = new Request("http://0.0.0.0:3000/api/keystatic/github/login");
    expect(() => withPublicCmsOrigin(request, "attacker.invalid")).toThrow("Invalid public CMS hostname");
    expect(() => withPublicCmsOrigin(request, "0123456789abcdef.lucas-reis.com.evil.test"))
      .toThrow("Invalid public CMS hostname");
  });
});
