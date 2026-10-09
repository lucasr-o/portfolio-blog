import { readPosts } from "./reader.js";
import { normalizeInstant } from "./model.js";
import { createMediaManifest, localMediaReader } from "./media.js";
import { ENGLISH, PORTUGUESE, selectLocalizedPosts } from "./locale.js";
import { resolveCommitDates } from "./history.js";

export async function loadPublication(workspaceRoot, publicationTime) {
  const cutoff = normalizeInstant(publicationTime);
  const records = await resolveCommitDates(workspaceRoot, await readPosts(workspaceRoot));
  const posts = selectLocalizedPosts(records, cutoff, ENGLISH);
  const ptPosts = selectLocalizedPosts(records, cutoff, PORTUGUESE);
  const media = await createMediaManifest([...posts, ...ptPosts], localMediaReader(workspaceRoot));
  return { publicationTime: cutoff, posts, ptPosts, media };
}
