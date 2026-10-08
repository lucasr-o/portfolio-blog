import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSearchIndex } from "@portfolio/blog-content/search";

export const SEARCH_INDEX_MAX_BYTES = 1_000_000;

export async function writeSearchIndexes(exportDirectory, publication) {
  const directory = path.join(exportDirectory, "blog-search");
  await mkdir(directory, { recursive: true });
  for (const [filename, locale, posts] of [
    ["en.json", "en", publication.posts],
    ["pt-BR.json", "pt-BR", publication.ptPosts],
  ]) {
    const content = JSON.stringify(buildSearchIndex(posts, locale));
    const bytes = Buffer.byteLength(content);
    if (bytes > SEARCH_INDEX_MAX_BYTES) {
      throw new Error(`Public ${locale} search index is ${bytes} bytes (limit ${SEARCH_INDEX_MAX_BYTES}); optimize terms or raise the reviewed budget before publishing.`);
    }
    await writeFile(path.join(directory, filename), content);
  }
}
