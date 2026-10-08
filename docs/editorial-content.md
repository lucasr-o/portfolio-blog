# Blog content

Only the blog belongs to the CMS. The portfolio stays in `data/profile.js`.

Each saved article is a YAML record at `content/posts/<slug>.yaml`. The `body` field is a **Markdown string**, not MDX or a visual document. The browser editor handles YAML serialization; paste Markdown into its multiline body field. Saving preserves indentation, fenced code and meaningful whitespace. Saving is not necessarily publishing.

## States and time

- `draft` is the default. A valid slug is required, but publication fields may be incomplete.
- `published` and `scheduled` both require title, summary, author, body and `publishedAt`.
- A record appears on the site only when it is not a draft **and** its publication instant has arrived. A future `published` record is not released early.
- Dates require an explicit timezone: `2026-10-01T09:00:00-03:00` is 09:00 in São Paulo, and is normalized to `2026-10-01T12:00:00.000Z`. Display timezone: `America/Sao_Paulo`. Optional `updatedAt` must not precede publication.
- One UTC cutoff governs the entire build: home, index, articles, metadata, sitemap and images. An invalid publication candidate blocks the build even if scheduled for the future; the error identifies its file and field.
- Reading time is computed from the body. Sorting uses publication date, then slug. Changing the update date does not move a post to the top.

**This repository is public. Drafts, scheduled articles, uploads and earlier revisions can be read on GitHub before or after website publication. Never store confidential material here.** Returning an article to draft removes it from the next public release, not Git history.

## Fields

The slug is the filename without `.yaml`: lowercase letters, numbers and single hyphens, up to 120 characters. It must be unique. Do not rename a published slug without a URL migration.

`author` defaults to Lucas Reis de Oliveira da Silva. `tags` is a list of short texts. `isPlaceholder` defaults to false; only demonstration articles should enable it. Optional `cover` and the `images` list contain `{src, alt}` records.

The checked-in example, `content/posts/security-reviews-that-move-at-product-speed.yaml`, is executable documentation: tests parse and validate it with the production reader and media validator. Its original slug and text were preserved, except for the domain correction to `.com` and the appended Markdown examples.

## Markdown and media

Supported: headings, paragraphs, lists, links, blockquotes, tables, inline code, fenced code with a language, and local images. Raw HTML, scripts, iframes and executable MDX are not supported. Put HTML demonstrations inside code fences.

Upload PNG, JPEG or WebP, at most 5 MiB per file and 40 megapixels, with descriptive alternative text. Still images only. Originals live under `content/media/`, not `public/`. Add each image to the article's Images field, then insert its reference, for example:

```markdown
![A diagram of the API trust boundary](/media/my-article/boundary.png)
```

The Markdown example above describes reference syntax, not a file shipped with the project. Use the uploaded image's exact reference. Remote images and traversal paths are rejected. Only images actually referenced in a published body or cover are exported, with a content hash and intrinsic dimensions. Unused uploads and draft-only media remain out of the static site.

Preview is designed to show the latest **saved** GitHub revision, not unsaved edits. Production authoring still requires the GitHub App and protected administrative hostname to be configured; creating local records does not configure these services.

## Public archive and search

The public blog shows at most six posts per archive page, newest first. The first pages are `/blog/` and `/pt/blog/`; when there are more than six eligible versions in a language, the next pages use `/blog/page/2/` or `/pt/blog/page/2/`. Switching language from an archive page returns to that language's first page. A later release removes a numbered route when enough posts are withdrawn.

Readers can search for words in the title, summary, tags **and complete Markdown body**. Use the search field on the first blog page or share a URL such as `/blog/?q=cryptography`; result pages use `&page=2` when needed. Search is case- and accent-insensitive and combines multiple keywords. It searches only articles published and eligible in the chosen language at the release cutoff. The search data is downloaded only when a reader searches.

Saving a draft in Keystatic does **not** make it searchable on the public site. Publishing (and reaching any scheduled publication time) still requires a successful release. Drafts and unapproved Portuguese translations remain absent from the public search files, although this public GitHub repository can expose saved editorial records.
