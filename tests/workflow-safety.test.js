import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const workflows = join(process.cwd(), ".github/workflows");
const checks = await readFile(join(workflows, "checks.yml"), "utf8");
const release = await readFile(join(workflows, "release.yml"), "utf8");
const cmsImage = await readFile(join(workflows, "cms-image.yml"), "utf8");

describe("GitHub Actions security boundary", () => {
  it("runs pull request checks with read-only repository permission and no AWS identity", () => {
    expect(checks).toMatch(/pull_request:/);
    expect(checks).toMatch(/contents: read/);
    expect(checks).not.toMatch(/id-token: write|AWS_DEPLOY_ROLE_ARN|configure-aws-credentials/);
    expect(checks).toMatch(/persist-credentials: false/);
    expect(checks).toMatch(/if: inputs\.release_artifact/);
  });

  it("serializes production mutations after checks and pins external actions", () => {
    expect(release).toMatch(/needs: \[preflight, verify\]/);
    expect(release).toMatch(/group: portfolio-blog-production\n\s+cancel-in-progress: false/);
    expect(release).toMatch(/if: needs\.preflight\.outputs\.deploy == 'true'/);
    expect(release).toMatch(/7,22,37,52 \* \* \* \*/);
    expect(release).toMatch(/workflow_dispatch:/);
    for (const source of [checks, release, cmsImage]) {
      for (const use of source.matchAll(/^\s+- uses: ([^\s#]+)/gm)) {
        if (use[1].startsWith("./")) continue;
        expect(use[1], "External actions must be pinned to a complete commit SHA")
          .toMatch(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[a-f0-9]{40}$/);
      }
    }
  });

  it("limits image publishing to main and the dedicated CMS code paths", () => {
    expect(cmsImage).toMatch(/branches: \[main\]/);
    expect(cmsImage).toMatch(/- 'apps\/cms\/\*\*'/);
    expect(cmsImage).toMatch(/if: github\.ref == 'refs\/heads\/main'/);
    expect(cmsImage).toMatch(/needs: verify/);
    expect(cmsImage).toMatch(/packages: write/);
    expect(cmsImage).toMatch(/platforms: linux\/arm64/);
    expect(cmsImage).toMatch(/org\.opencontainers\.image\.revision=/);
    expect(cmsImage).toMatch(/test ! -e \/app\/apps\/cms\/\.env/);
    expect(cmsImage).not.toMatch(/AWS_DEPLOY_ROLE_ARN|id-token: write/);
  });
});
