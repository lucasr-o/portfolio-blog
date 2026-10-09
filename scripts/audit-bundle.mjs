import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const clientBoundaries = [];

for (const directory of ["app", "components", "packages/blog-ui"]) {
  const entries = fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !/\.[jt]sx?$/.test(entry.name)) continue;
    const absolutePath = path.join(entry.parentPath, entry.name);
    const source = fs.readFileSync(absolutePath, "utf8");
    if (/^["']use client["'];/m.test(source)) clientBoundaries.push(path.relative(root, absolutePath));
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const runtimeDependencies = Object.keys(packageJson.dependencies ?? {});
const forbiddenRuntimeDependencies = runtimeDependencies.filter((dependency) =>
  /animate|motion|gsap|jquery|keystatic|keystar/i.test(dependency),
);

const chunksDirectory = path.join(root, "out", "_next", "static", "chunks");
if (!fs.existsSync(chunksDirectory)) throw new Error("Run pnpm build before the bundle audit.");

const chunkBytes = fs.readdirSync(chunksDirectory, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .reduce((total, entry) => total + fs.statSync(path.join(entry.parentPath, entry.name)).size, 0);

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolutePath] : [];
  });
}

const routeJavaScript = htmlFiles(path.join(root, "out")).map((htmlPath) => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"?]+\.js)(?:\?[^\"]*)?"/g)]
    .map((match) => match[1]))];
  const buffers = assets.map((asset) => fs.readFileSync(path.join(root, "out", asset)));
  return {
    route: `/${path.relative(path.join(root, "out"), htmlPath)}`,
    rawBytes: buffers.reduce((total, buffer) => total + buffer.length, 0),
    gzipBytes: buffers.reduce((total, buffer) => total + gzipSync(buffer, { level: 9 }).length, 0),
  };
});
const largestRoute = routeJavaScript.reduce((largest, current) =>
  current.rawBytes > largest.rawBytes ? current : largest);
const largestCompressedRoute = routeJavaScript.reduce((largest, current) =>
  current.gzipBytes > largest.gzipBytes ? current : largest);

const report = {
  clientBoundaries: clientBoundaries.sort(),
  runtimeDependencies,
  forbiddenRuntimeDependencies,
  exportedJavaScriptBytes: chunkBytes,
  largestRouteJavaScript: largestRoute,
  largestCompressedRouteJavaScript: largestCompressedRoute,
};

console.log(JSON.stringify(report, null, 2));

const expectedClientBoundaries = ["components/BlogSearch.jsx", "components/ScrollRevealManager.jsx", "components/SecurityTerminal.jsx", "packages/blog-ui/GifImage.jsx"];
if (JSON.stringify(clientBoundaries.sort()) !== JSON.stringify(expectedClientBoundaries)) {
  throw new Error(`Unexpected application client boundaries: ${clientBoundaries.join(", ")}`);
}
if (forbiddenRuntimeDependencies.length > 0) {
  throw new Error(`Unexpected animation/runtime dependencies: ${forbiddenRuntimeDependencies.join(", ")}`);
}
// The exported total includes route-specific chunks that no one page loads together.
// Keep that ceiling, and separately guard the actual worst-case route transfer.
if (chunkBytes > 800_000) throw new Error(`Exported JavaScript exceeds the 800 kB budget: ${chunkBytes}`);
if (largestRoute.rawBytes > 750_000) {
  throw new Error(`Route JavaScript exceeds the 750 kB budget: ${largestRoute.route} (${largestRoute.rawBytes})`);
}
if (largestCompressedRoute.gzipBytes > 230_000) {
  throw new Error(`Gzipped route JavaScript exceeds the 230 kB budget: ${largestCompressedRoute.route} (${largestCompressedRoute.gzipBytes})`);
}
