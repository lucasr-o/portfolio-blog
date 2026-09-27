import { readFileSync } from "node:fs";
import { loadPublication } from "@portfolio/blog-content/publication";


export function getPublicContent() {
  // A build shares one captured snapshot across Next's workers and every route.
  // Development re-reads disk so local content edits are immediately visible.
  if (process.env.BLOG_SNAPSHOT_PATH) return JSON.parse(readFileSync(process.env.BLOG_SNAPSHOT_PATH, "utf8"));
  return loadPublication(process.cwd(), process.env.BLOG_PUBLICATION_TIME ?? new Date().toISOString());
}
