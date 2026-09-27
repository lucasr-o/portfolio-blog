import { spawnSync } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadPublication } from "@portfolio/blog-content/publication";
import { auditPublication } from "./audit-publication.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = process.env.BLOG_CONTENT_ROOT ? path.resolve(process.env.BLOG_CONTENT_ROOT) : root;
const publicationTime = process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString();
const publication = await loadPublication(contentRoot, publicationTime);
const snapshotPath = path.join(root, ".cache/publication.json");
await mkdir(path.dirname(snapshotPath), { recursive: true });
await writeFile(snapshotPath, JSON.stringify(publication));
const next = path.join(root, "node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [next, "build", ...process.argv.slice(2)], {
  cwd: root, stdio: "inherit",
  env: { ...process.env, BLOG_PUBLICATION_TIME: publication.publicationTime, BLOG_SNAPSHOT_PATH: snapshotPath },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

// Next emits internal RSC payloads even for this notFound() path. They are build
// intermediates, not deployable routes. Remove only the reserved generated folder.
if (publication.posts.length === 0) {
  await rm(path.join(root, "out/blog/__empty__"), { recursive: true, force: true });
}
if (Object.keys(publication.media).length === 0) {
  await rm(path.join(root, "out/media/posts/__empty__"), { recursive: true, force: true });
}
await auditPublication({ root, contentRoot, publication });
console.info(`Published snapshot: ${publication.posts.length} articles at ${publication.publicationTime}`);
