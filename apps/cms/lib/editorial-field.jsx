import { DEFAULT_AUTHOR, MAX_IMAGE_BYTES, validatePost } from "@portfolio/blog-content/model";
import { referencedImages } from "@portfolio/blog-content/references";
import { ENGLISH, PORTUGUESE, projectPost } from "@portfolio/blog-content/locale";
import { imageExtension, reconcileInlineAssets, safeAssetFilename } from "./inline-media.js";
import EditorialInput from "./editorial-input.jsx";

const MEDIA_DIRECTORY = "content/media";

function emptyEditorial() {
  return {
    titleLocale: "pt", status: "draft", author: DEFAULT_AUTHOR,
    pt: { publish: false, summary: "", body: "", tags: [], coverAlt: "" },
    en: { publish: false, title: "", summary: "", body: "", tags: [], coverAlt: "" },
  };
}

export function editorialPrototypeField() {
  return {
    kind: "form", formKind: "assets", directories: [MEDIA_DIRECTORY],
    defaultValue() { return { data: emptyEditorial(), assets: new Map() }; },
    parse(value, { external, slug }) {
      if (value !== undefined && (!value || typeof value !== "object" || Array.isArray(value))) {
        throw new Error("Expected an editorial object.");
      }
      const data = value === undefined ? emptyEditorial() : structuredClone(value);
      return { data, slug, assets: new Map(external.get(MEDIA_DIRECTORY) ?? []) };
    },
    serialize(value, { slug }) {
      const reconciled = reconcileInlineAssets(value.data, value.assets, slug);
      return {
        value: reconciled.data,
        other: new Map(),
        external: new Map([[MEDIA_DIRECTORY, reconciled.assets]]),
      };
    },
    validate(value) {
      const post = validatePost({ title: "Validated by the separate required slug field", editorial: value.data }, "editorial-prototype");
      if (post.status === "published") {
        for (const locale of [PORTUGUESE, ENGLISH]) {
          if (post[locale === PORTUGUESE ? "pt" : "en"]?.publish) referencedImages(projectPost(post, locale));
        }
      }
      for (const [filename, bytes] of value.assets) {
        if (!safeAssetFilename(filename) || !(bytes instanceof Uint8Array) || !bytes.length || bytes.length > MAX_IMAGE_BYTES) {
          throw new Error("Editorial media must have a safe filename and valid bytes below 5 MiB.");
        }
        if (/^[a-f0-9]{64}\./.test(filename) && !filename.endsWith(`.${imageExtension(bytes)}`)) throw new Error("Image bytes do not match their extension.");
      }
      return value;
    },
    reader: {
      parse(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an editorial object.");
        return value;
      },
    },
    Input: EditorialInput,
  };
}
