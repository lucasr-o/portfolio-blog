import { collection, config, fields } from "@keystatic/core";
import { DEFAULT_AUTHOR, SLUG_PATTERN, normalizeInstant } from "@portfolio/blog-content/model";
import { editorialImageField } from "./lib/image-field.js";

const local = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_CMS_STORAGE !== "github";

function instantField(label) {
  const field = fields.text({
    label,
    description: "São Paulo example: 2026-10-01T09:00:00-03:00. Saved as UTC. Leave blank for an incomplete draft.",
    validation: { pattern: { regex: /^(?:|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))$/, message: "Use an ISO timestamp with timezone, or leave blank for a draft." } },
  });
  return {
    ...field,
    serialize(value) { return field.serialize(value ? normalizeInstant(value) : value); },
  };
}

const imageFields = () => fields.object({
  src: editorialImageField(),
  alt: fields.text({ label: "Alternative text", description: "Describe the image. Required for publication." }),
});

export default config({
  storage: local ? { kind: "local" } : { kind: "github", repo: "lucasr-o/portfolio-blog" },
  ui: { brand: { name: "Lucas Reis — Blog" } },
  collections: {
    posts: collection({
      label: "Blog posts", path: "content/posts/*", slugField: "title", format: "yaml",
      columns: ["title", "status", "publishedAt"],
      previewUrl: local ? undefined : "/preview/{slug}",
      schema: {
        title: fields.slug({
          name: { label: "Title", description: "Required for publication; drafts may be incomplete." },
          slug: { label: "URL slug", description: "Do not rename a published slug without a URL migration.", validation: { length: { min: 1, max: 120 }, pattern: { regex: SLUG_PATTERN, message: "Use lowercase letters, numbers and single hyphens." } } },
        }),
        summary: fields.text({ label: "Summary", multiline: true, description: "Required for publication. Used in the index, homepage and search metadata." }),
        author: fields.text({ label: "Author", defaultValue: DEFAULT_AUTHOR }),
        status: fields.select({ label: "Publication state", defaultValue: "draft", options: [
          { label: "Draft — not on the website", value: "draft" },
          { label: "Published — visible when its date arrives", value: "published" },
          { label: "Scheduled — visible after its date and the next deploy", value: "scheduled" },
        ], description: "Saving writes to a PUBLIC GitHub repository. Drafts are not confidential. Work on main for the production workflow." }),
        publishedAt: instantField("Publication date and time"),
        updatedAt: instantField("Last updated (optional)"),
        tags: fields.array(fields.text({ label: "Tag", validation: { isRequired: true, length: { max: 60 } } }), { label: "Topics", itemLabel: (props) => props.value }),
        isPlaceholder: fields.checkbox({ label: "Demonstration article", defaultValue: false }),
        cover: imageFields(),
        images: fields.array(imageFields(), { label: "Images", itemLabel: (props) => props.fields.alt.value || "Image", description: "Add uploads here before referencing them in Markdown. Saved image references will be available in the preview." }),
        body: fields.text({ label: "Markdown", multiline: true, description: "Write or paste Markdown source: headings, lists, links, tables and fenced code. Raw HTML is disabled. Save before previewing; saving a draft does not publish it on the website." }),
      },
    }),
  },
});
