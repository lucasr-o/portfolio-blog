import { readPosts } from "./reader.js";
import { normalizeInstant, selectPublishedPosts } from "./model.js";
import { createMediaManifest, localMediaReader } from "./media.js";
import { selectPortuguesePosts } from "./locale.js";

export async function loadPublication(workspaceRoot, publicationTime) {
  const cutoff = normalizeInstant(publicationTime);
  const posts = selectPublishedPosts(await readPosts(workspaceRoot), cutoff);
  const ptPosts = selectPortuguesePosts(posts);
  const media = await createMediaManifest([...posts, ...ptPosts], localMediaReader(workspaceRoot));
  return { publicationTime: cutoff, posts, ptPosts, media };
}
