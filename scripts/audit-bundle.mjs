import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientBoundaries = [];

for (const directory of ["app", "components"]) {
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
  /animate|motion|gsap|jquery/i.test(dependency),
);

const chunksDirectory = path.join(root, "out", "_next", "static", "chunks");
if (!fs.existsSync(chunksDirectory)) throw new Error("Run pnpm build before the bundle audit.");

const chunkBytes = fs.readdirSync(chunksDirectory, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .reduce((total, entry) => total + fs.statSync(path.join(entry.parentPath, entry.name)).size, 0);

const report = {
  clientBoundaries: clientBoundaries.sort(),
  runtimeDependencies,
  forbiddenRuntimeDependencies,
  exportedJavaScriptBytes: chunkBytes,
};

console.log(JSON.stringify(report, null, 2));

const expectedClientBoundaries = ["components/ScrollRevealManager.jsx", "components/SecurityTerminal.jsx"];
if (JSON.stringify(clientBoundaries.sort()) !== JSON.stringify(expectedClientBoundaries)) {
  throw new Error(`Unexpected application client boundaries: ${clientBoundaries.join(", ")}`);
}
if (forbiddenRuntimeDependencies.length > 0) {
  throw new Error(`Unexpected animation/runtime dependencies: ${forbiddenRuntimeDependencies.join(", ")}`);
}
