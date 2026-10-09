import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReleaseManifest } from "./release-plan.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const revision = process.env.GITHUB_SHA;
const runId = process.env.GITHUB_RUN_ID;
const attempt = process.env.GITHUB_RUN_ATTEMPT;
if (!/^[0-9]{1,20}$/.test(runId ?? "") || !/^[1-9][0-9]*$/.test(attempt ?? "")) {
  throw new Error("A GitHub run ID and positive attempt number are required");
}
const publication = JSON.parse(await readFile(path.join(root, ".cache/publication.json"), "utf8"));
const manifest = await buildReleaseManifest({ exportDirectory: path.join(root, "out"),
  sourceRevision: revision, releaseId: `${revision}-${runId}-${attempt}`,
  publicationTime: publication.publicationTime, posts: publication.posts.map((post) => post.slug),
  portuguesePosts: publication.ptPosts.map((post) => post.slug),
  publicFingerprint: publication.publicFingerprint });
const destination = path.join(root, ".cache/release-manifest.json");
await writeFile(destination, JSON.stringify(manifest, null, 2) + "\n");
console.info(`Release plan ${manifest.releaseId}: ${manifest.files.length} files, ${manifest.posts.length} English and ${manifest.portuguesePosts.length} Portuguese posts, cutoff ${manifest.publicationTime}`);
