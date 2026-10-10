# Blog content

Only the blog belongs to the CMS. Portfolio details remain in `data/profile.js`. The current [Portuguese-first authoring guide](blog-editor-v2.md) explains the browser workflow; the [previous guide](blog-editor.md) is historical.

Each article has one stable slug and one YAML record at `content/posts/<slug>.yaml`. Its root `title` seeds the slug; a grouped `editorial` record holds shared author/media and independent `pt` and `en` versions. The Markdown bodies remain editable source text, not MDX or an executable document. A new article can be written and published in Portuguese before any English text exists. Existing English-origin articles retain their original slug and title identity.

## Visibility and dates

- Keep the global state at `draft` while writing. To publish, choose `published` and approve at least one complete language. Each approved version needs its own title, summary, Markdown body and meaningful image descriptions. A Portuguese-only article appears only under `/pt/blog/<slug>/`; adding English later creates `/blog/<slug>/` without changing the Portuguese URL.
- The first successful `main` commit containing an article establishes its creation instant. The first qualifying published commit establishes that language's immutable first-publication instant; a later English translation gets its own later date. Public edits may get a separate modification instant. Reviewed publication dates on pre-migration articles are retained as legacy pins.
- Neither a browser draft nor a failed save creates a publication date. There is no date field and no `Scheduled` state. Saving a public change to `main` starts the verified site workflow; no 15-minute polling remains. Saving an unchanged public projection still checks the content but skips site upload and CDN invalidation.
- Withdrawing one language removes only that language's public surfaces after a successful release. Returning the article to `draft` withdraws both. Neither action erases Git history or resets the original first-publication dates.

**The repository is public. Drafts, uploads and earlier revisions can be read on GitHub even when absent from the website. Never store confidential material here.** A release failure leaves the previous public snapshot in place; always verify the workflow and the public URL before announcing a publication or withdrawal.

## Markdown and media

Supported Markdown includes headings, paragraphs, lists, links, blockquotes, tables, inline/fenced code and local images. Raw HTML, scripts, iframes and executable MDX are not enabled. Put HTML demonstrations inside code fences.

With the cursor in Markdown, paste an image, drop a file or use the picker. The editor asks for alternative text, stages validated bytes with the Markdown reference and commits them together when Save succeeds. You may reuse a saved asset in both languages with different alt text. A preview represents the **last saved revision**, not unsaved text or images. Pasting plain text or an image URL does not fetch remote media.

Body media accepts genuine PNG, JPEG, WebP and GIF up to 5 MiB. GIFs are also bounded by frames and decoded pixels; the optional cover remains a still image. GIFs use a static first-frame poster until the reader plays them, with a pause control and reduced-motion support. SVG uploads, malformed files, disguised extensions, remote images and traversal paths are rejected. New assets use stable content-addressed paths under `content/media/`; existing indexed paths remain readable. Only referenced media from an approved public language is exported to S3, with intrinsic dimensions and the correct MIME/cache headers.

## Public discovery

The English home feature and `/blog/` list only published English versions. `/pt/blog/` lists only published Portuguese versions. Cards, article routes, search, sitemap and language switches use the same eligibility rule and each language's own first-publication date. There is no cross-language text fallback. The existing `review-cwes` article remains at the same English and Portuguese URLs with its reviewed legacy date.

Each archive page shows at most six posts per language; numbered pages appear only when needed. Search covers title, summary, tags and the complete Markdown body in that language. A shareable query uses `/blog/?q=keyword` or `/pt/blog/?q=palavra`; results can paginate with `page=2`. Search data is loaded only when a reader searches. Drafts and unapproved translations do not enter public search, sitemap, article routes or exported media solely for that version.

The demonstration records `cms-markdown-demonstration` and `security-reviews-that-move-at-product-speed` remain drafts; they are examples in the public repository, not visitor-facing posts.
