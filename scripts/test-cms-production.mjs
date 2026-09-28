import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { cp } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build", "apps/cms"], {
  stdio: "inherit", env: { ...process.env, CMS_TEST_OUTPUT: "0" },
});
if (result.status !== 0) process.exit(result.status ?? 1);
const standalone = path.join(root, "apps/cms/.next/standalone/apps/cms");
await cp(path.join(root, "apps/cms/.next/static"), path.join(standalone, ".next/static"), { recursive: true });
const child = spawn(process.execPath, [path.join(standalone, "server.js")], {
  cwd: standalone, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, PORT: "3003", HOSTNAME: "127.0.0.1" },
});
try {
  const origin = "http://127.0.0.1:3003";
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("The production CMS server exited before becoming healthy.");
    try { ready = (await fetch(`${origin}/api/health`)).ok; } catch { /* Wait for this child only. */ }
    if (ready) break;
    await delay(100);
  }
  assert(ready, "Production CMS did not become healthy.");
  for (const route of ["/preview", "/preview/cms-markdown-demonstration", `/preview/media/${"a".repeat(40)}/cms-markdown-demonstration/${"b".repeat(64)}.png`]) {
    const response = await fetch(`${origin}${route}`);
    assert.match(response.headers.get("cache-control"), /private/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    const text = await response.text();
    assert.match(text, /Sign in to Keystatic with GitHub/);
    assert(!text.includes("Browser-authored Markdown"), "Unauthorized preview exposed an article.");
    if (route.includes("/media/")) assert.equal(response.status, 401);
  }
  console.info("Production preview authentication, no-store and noindex checks passed.");
} finally {
  child.kill("SIGTERM");
}
