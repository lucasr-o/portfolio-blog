# Proposal

## Why

The first real post exposed friction in the editorial flow: the CMS requires English and a hand-entered timestamp before Portuguese can publish, image insertion needs a save-and-copy detour, and quarter-hourly checks create noise even when nothing is scheduled. Lucas wants to write in Portuguese first, publish either language when ready, and have a reliable, low-noise path from a CMS save to the static site.

## What Changes

- Make Portuguese the first authoring section and independently publishable; English remains optional and may be published later. Keep `/blog/` and the English portfolio homepage English-only, while `/pt/blog/` lists Portuguese versions. An English version published later gets its own first-publication date and can become the newest English post.
- Derive creation and per-language first-publication timestamps from the first qualifying successful commit on `main`, preserving reviewed legacy dates. Do not ask the author to enter a time or timezone. Keep publication dates stable across edits and withdrawals; derive updates separately. Validate publication readiness in the editor before a saved `Published` state can enter the release pipeline.
- Preserve editable raw Markdown while adding clipboard paste and file-drop/upload that attach an image to the post and insert its Markdown reference at the cursor in one save. Keep the shared image inventory and language-specific alternative text.
- Accept validated animated GIFs in article bodies, alongside still PNG/JPEG/WebP images. Keep the optional article cover static; provide a controlled, reduced-motion-safe presentation and bounded media size.
- **BREAKING (editorial workflow and source schema):** remove `Scheduled` and the site-release cron. Publishing, editing, translating and withdrawing public content happen on a successful CMS commit to `main`; a manual dispatch remains for recovery. Draft-only saves must not deploy unchanged public output. Existing records and published URLs must be migrated without silently exposing drafts or dropping public articles.

## Capabilities

### New Capabilities

- `blog-authoring`: Portuguese-first Markdown authoring, automatic dates, paste/drop media and GIF validation. This established path currently exists only as an unsynchronized delta in `portfolio-blog`.
- `blog-localization`: independently publishable language versions and per-language timestamps. This established path currently exists only as an unsynchronized delta in `bilingual-blog-posts`.
- `continuous-delivery`: push-driven publication/withdrawal without scheduled polling. This established path currently exists only as an unsynchronized delta in `portfolio-blog`.

### Modified Capabilities

- `blog-experience`: English-only homepage/latest selection, locale-specific indexes, and publication ordering when languages become available at different times.
- `site-quality`: animated editorial media must preserve accessibility, security and performance expectations.

## Impact

The change affects Keystatic's collection/editor and protected preview, the YAML content model and migration, publication and media manifests, static routes/search/sitemap/metadata, release preflight and workflow, media MIME handling, tests, and CMS operating guidance. Existing English and Portuguese URLs, the S3/CloudFront/OAC architecture, and the isolated Raspberry Pi CMS stack remain. Older OpenSpec deltas conflict with the new language/date/scheduling decisions and must be reconciled in order before final spec synchronization; this proposal does not edit those historical changes.
