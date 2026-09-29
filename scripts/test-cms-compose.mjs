import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { renderProxyConfig } from "../ops/cms/proxy.mjs";

const testRoot = await mkdtemp(join(tmpdir(), "portfolio-blog-compose-check-"));
try {
  await mkdir(join(testRoot, "secrets"));
  await mkdir(join(testRoot, "generated"));
  await copyFile(new URL("../ops/cms/compose.yml", import.meta.url), join(testRoot, "compose.yml"));
  await writeFile(join(testRoot, ".env"),
    `CMS_IMAGE=ghcr.io/lucasr-o/portfolio-blog-cms@sha256:${"a".repeat(64)}\nCMS_HOSTNAME=4fa8522f3d6b.lucas-reis.com\n`);
  await writeFile(join(testRoot, "secrets/cms.env"),
    "KEYSTATIC_GITHUB_CLIENT_ID=test-public-id\nKEYSTATIC_GITHUB_CLIENT_SECRET=test-only\nKEYSTATIC_SECRET=test-only\n");
  await writeFile(join(testRoot, "secrets/cms.htpasswd"), "editor:test-only\n");
  await writeFile(join(testRoot, "secrets/tunnel-token"), "test-only\n");
  await writeFile(join(testRoot, "generated/nginx.conf"), await renderProxyConfig("4fa8522f3d6b.lucas-reis.com"));
  const result = spawnSync("docker", ["compose", "--project-directory", testRoot,
    "-f", join(testRoot, "compose.yml"), "config", "--format", "json"], {
    cwd: testRoot, encoding: "utf8", timeout: 30_000,
  });
  if (result.error || result.status !== 0) throw new Error(`Compose validation failed: ${result.error?.message ?? result.stderr.trim()}`);
  const config = JSON.parse(result.stdout);
  assert.equal(config.name, "portfolio-blog-cms");
  assert.deepEqual(Object.keys(config.services).sort(), ["cms", "proxy", "tunnel"]);
  const memory = { cms: 768 * 1024 * 1024, proxy: 64 * 1024 * 1024, tunnel: 128 * 1024 * 1024 };
  for (const [name, service] of Object.entries(config.services)) {
    assert.equal(Number(service.mem_limit), memory[name], `${name} memory ceiling`);
    assert.equal(service.read_only, true, `${name} filesystem`);
    assert.deepEqual(service.cap_drop, ["ALL"]);
    assert.equal(service.ports, undefined, `${name} exposes a host port`);
    assert.equal(service.network_mode, undefined, `${name} uses host networking`);
    assert.deepEqual(Object.keys(service.networks), ["editor"]);
    assert.equal(JSON.stringify(service).includes("docker.sock"), false);
    assert.ok(service.logging?.options?.["max-size"]);
  }
  assert.equal(config.services.cms.image,
    `ghcr.io/lucasr-o/portfolio-blog-cms@sha256:${"a".repeat(64)}`);
  assert.deepEqual(config.services.tunnel.command.slice(-2), ["--token-file", "/run/secrets/tunnel-token"]);
  assert.equal(config.services.tunnel.volumes.every((volume) => volume.read_only), true);
  assert.equal(config.services.proxy.volumes.every((volume) => volume.read_only), true);
  console.info("CMS Compose validated: three dedicated services, no host ports or Docker socket, pinned images, read-only filesystems and bounded memory/logging.");
} finally {
  await rm(testRoot, { recursive: true, force: true });
}
