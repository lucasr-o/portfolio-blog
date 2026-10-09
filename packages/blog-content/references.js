import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { ContentError, mediaRepositoryPath } from "./model.js";

export function referencedImages(post) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(post.body);
  const definitions = new Map();
  visit(tree, "definition", (node) => definitions.set(node.identifier.toLowerCase(), node.url));
  const refs = [];
  if (post.cover) refs.push(post.cover);
  visit(tree, (node) => {
    if (node.type === "image") refs.push({ src: node.url, alt: node.alt });
    if (node.type === "imageReference") refs.push({ src: definitions.get(node.identifier.toLowerCase()), alt: node.alt });
  });
  const declared = new Map([...(post.cover ? [post.cover] : []), ...post.images].map((image) => [image.src, image]));
  for (const reference of refs) {
    const field = `${post.slug}:${post.locale === "pt-BR" ? "pt.body" : "body"}.image`;
    try { mediaRepositoryPath(reference.src); } catch (error) { throw new ContentError([{ path: field, message: error.message }]); }
    if (!reference.alt?.trim()) throw new ContentError([{ path: field, message: `Add descriptive alt text for ${reference.src}.` }]);
    if (!declared.has(reference.src)) throw new ContentError([{ path: field, message: `Add ${reference.src} to the Images field before using it in Markdown.` }]);
  }
  return refs;
}
