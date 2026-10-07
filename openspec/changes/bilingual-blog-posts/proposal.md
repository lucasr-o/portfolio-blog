# Proposal

## Why

Lucas wants to publish an English article first and add a Portuguese version later, without delaying the original publication or making readers encounter mixed-language previews. The existing blog has one title, summary, Markdown body and public route per post, so a language switch needs an editorial and routing contract rather than a client-only text toggle.

## What Changes

- Keep existing English `/blog/` and `/blog/<slug>/` URLs and add a Portuguese index and article URLs under `/pt/blog/`.
- Let Lucas write and save an optional Portuguese title, summary and Markdown body in the existing browser-based Keystatic post record, with an explicit readiness control; incomplete or unapproved translations remain absent from the public site.
- Show a compact EN/PT language choice on the blog index and on articles that have both public versions. Portuguese previews, article text, dates, reading time, labels and links use Portuguese; the English homepage's Latest Writing remains English.
- Generate localized HTML language, metadata, canonical/alternate links, structured data and sitemap entries only for public versions. Preserve the current shared publication eligibility, static export, Markdown safety and CMS protection.
- Extend previews, media handling, publication auditing and tests so a private translation cannot leak through HTML, payloads, sitemap or images.

## Capabilities

### New Capabilities

- `blog-localization`: Optional Portuguese authoring, explicit translation readiness and per-language publication eligibility within a single post record.

### Modified Capabilities

- `blog-experience`: Blog indexes and articles gain coherent locale-specific content, navigation and language switching without changing English URLs.
- `site-quality`: Localized blog pages gain correct document language and locale-specific search/discovery metadata while retaining static performance and accessibility requirements.

## Impact

Keystatic's post schema and saved preview, the shared content model/renderer, public blog routes and previews, media manifest and release audit, sitemap/metadata/JSON-LD, and content/SEO/end-to-end tests change. No new visitor-time API, translation service, AWS component or Raspberry Pi workload is required. This is a separate extension to the in-progress `portfolio-blog` change, whose original scope excluded translation; that change's artifacts and unrelated local edits remain untouched.
