import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { ContentError, parsePostYaml } from "./model.js";

export async function readPosts(workspaceRoot) {
  const directory = path.join(workspaceRoot, "content/posts");
  const names = (await readdir(directory)).sort();
  const posts = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    if (!name.endsWith(".yaml")) throw new ContentError([{ path: name, message: "Expected a .yaml article record." }]);
    const file = path.join(directory, name);
    if (await realpath(file) !== file) throw new ContentError([{ path: name, message: "Symlinks are not allowed in editorial records." }]);
    posts.push(parsePostYaml(await readFile(file, "utf8"), name.slice(0, -5), `content/posts/${name}`));
  }
  return posts;
}
