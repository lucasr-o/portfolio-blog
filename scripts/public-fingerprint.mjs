import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, readFile, readlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ignored = [
  /^content\/(?:posts|media)\//,
  /^apps\/cms\//, /^ops\//, /^docs\//, /^openspec\//,
  /^tests\//, /^e2e\//, /^\.github\/workflows\/(?:cms-image|retention|oidc-claims)\.yml$/,
  /^(?:README\.md|AGENTS\.md|CLAUDE\.md|\.gitignore|playwright\.[^/]+|vitest\.[^/]+)$/,
];

function publicCodePath(name) {
  return !ignored.some((pattern) => pattern.test(name));
}

export async function computePublicFingerprint(root, publication) {
  const { stdout } = await run("git", ["-C", root, "ls-files", "-z"], {
    encoding: "buffer", maxBuffer: 8 * 1024 * 1024,
  });
  const hash = createHash("sha256");
  hash.update("portfolio-blog-public-v1\0");
  for (const name of stdout.toString("utf8").split("\0").filter((value) => value && publicCodePath(value)).sort()) {
    const absolute = path.join(root, name);
    const info = await lstat(absolute);
    const bytes = info.isSymbolicLink() ? Buffer.from(await readlink(absolute)) : await readFile(absolute);
    hash.update(name); hash.update("\0"); hash.update(info.isSymbolicLink() ? "link\0" : "file\0");
    hash.update(bytes); hash.update("\0");
  }
  const publicOutput = {
    posts: publication.posts,
    portuguesePosts: publication.ptPosts,
    media: Object.fromEntries(Object.entries(publication.media).map(([reference, asset]) =>
      [reference, { hash: asset.hash, posterHash: asset.posterHash, width: asset.width, height: asset.height }])),
  };
  hash.update(JSON.stringify(publicOutput));
  return hash.digest("hex");
}
