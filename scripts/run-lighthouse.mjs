import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pnpmCli = process.env.npm_execpath;
const baseUrl = "http://127.0.0.1:4173";
const routes = [
  ["home", "/"],
  ["blog", "/blog/"],
  ["pt-blog", "/pt/blog/"],
  ["post", "/blog/security-reviews-that-move-at-product-speed/"],
];
const outputDirectory = path.join(root, ".lighthouse");
fs.mkdirSync(outputDirectory, { recursive: true });

if (!pnpmCli) throw new Error("Run this script through pnpm lighthouse.");

const runPnpm = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [pnpmCli, ...args], { cwd: root, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`pnpm ${args.join(" ")} exited with ${code}`)));
});

const server = spawn(process.execPath, [pnpmCli, "exec", "serve", "out", "-l", "4173"], {
  cwd: root,
  detached: process.platform !== "win32",
  stdio: "ignore",
});

try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) break;
    } catch {}
    if (attempt === 59) throw new Error("Preview server did not become ready.");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const results = [];
  for (const [name, route] of routes) {
    const outputPath = path.join(outputDirectory, `${name}.json`);
    await runPnpm([
      "exec", "lighthouse", `${baseUrl}${route}`,
      "--quiet",
      "--output=json",
      `--output-path=${outputPath}`,
      "--only-categories=performance,accessibility,best-practices,seo",
      "--chrome-path=/usr/bin/google-chrome",
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
    ]);
    const report = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
    results.push({ route, scores });
  }

  console.table(results.flatMap(({ route, scores }) => Object.entries(scores).map(([category, score]) => ({ route, category, score }))));
  const failures = results.flatMap(({ route, scores }) => Object.entries(scores)
    .filter(([, score]) => score < 90)
    .map(([category, score]) => `${route} ${category}: ${score}`));
  if (failures.length) throw new Error(`Lighthouse scores below 90:\n${failures.join("\n")}`);
} finally {
  if (process.platform === "win32") server.kill("SIGTERM");
  else {
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
  }
}
