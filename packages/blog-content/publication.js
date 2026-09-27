import { readPosts } from "./reader.js";
import { normalizeInstant, selectPublishedPosts } from "./model.js";
import { createMediaManifest, localMediaReader } from "./media.js";

export async function loadPublication(workspaceRoot, publicationTime) {
  const cutoff = normalizeInstant(publicationTime);
  const posts = selectPublishedPosts(await readPosts(workspaceRoot), cutoff);
  const media = await createMediaManifest(posts, localMediaReader(workspaceRoot));
  return { publicationTime: cutoff, posts, media };
}
