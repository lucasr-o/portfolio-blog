import { spawnSync } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadPublication } from "@portfolio/blog-content/publication";
import { auditPublication } from "./audit-publication.mjs";
import { writeSearchIndexes } from "./write-search-index.mjs";
import { pageCount } from "@portfolio/blog-content/pagination";
import { computePublicFingerprint } from "./public-fingerprint.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = process.env.BLOG_CONTENT_ROOT ? path.resolve(process.env.BLOG_CONTENT_ROOT) : root;
const publicationTime = process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString();
const publication = await loadPublication(contentRoot, publicationTime);
publication.publicFingerprint = await computePublicFingerprint(root, publication);
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
if (publication.ptPosts.length === 0) {
  await rm(path.join(root, "out/pt/blog/__empty__"), { recursive: true, force: true });
}
if (Object.keys(publication.media).length === 0) {
  await rm(path.join(root, "out/media/posts/__empty__"), { recursive: true, force: true });
}
if (pageCount(publication.posts.length) === 1) {
  await rm(path.join(root, "out/blog/page/__empty__"), { recursive: true, force: true });
}
if (pageCount(publication.ptPosts.length) === 1) {
  await rm(path.join(root, "out/pt/blog/page/__empty__"), { recursive: true, force: true });
}
await writeSearchIndexes(path.join(root, "out"), publication);
await auditPublication({ root, contentRoot, publication });
console.info(`Published snapshot: ${publication.posts.length} English articles, ${publication.ptPosts.length} Portuguese versions at ${publication.publicationTime}`);
