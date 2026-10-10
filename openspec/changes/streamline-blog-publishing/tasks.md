# Tasks

## 1. Baseline and compatibility guardrails

- [x] 1.1 Inventory the current YAML shapes, public English/Portuguese routes, release manifest, CMS image and invalid `Published` records without modifying unrelated worktree files; save a comparison checklist for the rollout and verify it against the current static export.
- [x] 1.2 Add a dual-read article model for legacy root-English records and the final date-less root-title-plus-`editorial` YAML records, preserving slugs, reviewed legacy date pins and indexed media references; add fixtures and unit tests for English-only, bilingual, draft, invalid and legacy scheduled records. The intermediate flat-locale reader is not sufficient for completion.
- [x] 1.3 Update public selection, rendering and metadata callers to consume that compatible model after commit-history dates are resolved, without writing new-format YAML yet; verify existing English URLs, Portuguese URLs, home feature, search and sitemap against the baseline, and document the compatibility period.

## 2. Prove the editor lifecycle before migrating content

- [ ] 2.1 Prototype the installed Keystatic version's top-level title/slug field plus one Portuguese-first compound editorial/assets field for global status, per-language approval, Markdown and media, with no date field; verify parse/serialize, first save, retry after failed save and edit of an existing English-origin record in an isolated test collection.
- [x] 2.2 Resolve creation, first-publication and modification instants from the first qualifying commits in full production `main` history; preserve reviewed legacy pins, cache per build, fail closed for missing/rewritten/shallow history or invalid public content, and test drafts, failed saves, edits, withdrawal/re-publication and later English publication.
- [ ] 2.3 Gate the rest of this change on proof that the root slug stays stable and the complete `editorial` transition, including pasted media bytes, is validated and saved in one Keystatic Git commit; if the pinned form API cannot guarantee this, record the failing case and revise the design before any schema migration or production write.
- [x] 2.4 Replace the authoring form with Portuguese first, optional English, stable shared slug and no manual date or Scheduled controls; verify a Portuguese-only article can be saved/published and update the CMS authoring guide with the new lifecycle.

## 3. Make raw Markdown media authoring direct and safe

- [ ] 3.1 Prototype the raw-Markdown field plus asset state so pasted or dropped image bytes and the inserted local Markdown reference are saved in the same Keystatic commit; test multiple pastes, retry, deduplication and removal without orphaned or broken references.
- [ ] 3.2 Implement Ctrl+V, drop and file-picker insertion at the cursor while preserving ordinary text paste, fenced code and exact Markdown round-tripping; verify keyboard navigation, visible save/error feedback, editable alt text and reuse of one asset in both languages with locale-specific alt text.
- [x] 3.3 Give new inline media stable content-addressed paths while retaining legacy indexed-media reads; reject remote fetches and unsafe asset paths, and test that reordering or editing media never breaks existing Markdown references.
- [x] 3.4 Keep protected preview tied to the last saved Git revision and make unsaved media state explicit; document the paste/fallback workflow and verify no preview claims that unsaved images are live.

## 4. Support bounded GIFs throughout the media pipeline

- [x] 4.1 Extend CMS upload and content validation to accept real GIF bytes for body media only, with byte, dimension, frame-count and decoded-pixel limits; test spoofed extensions/MIME, oversized files, malformed GIFs and cover rejection.
- [x] 4.2 Generate a deterministic still poster and preserve validated GIF/poster paths through preview, static export, S3 upload metadata and public routes; verify `image/gif`, image cache headers and no HTML fallback for either asset.
- [ ] 4.3 Render body GIFs with reserved dimensions, lazy loading, a keyboard-accessible Pause/Play control and a poster-first reduced-motion path; test keyboard, screen-reader labels, reduced-motion behavior and representative mobile transfer/CPU budgets.
- [ ] 4.4 Update the authoring/media documentation with GIF limits, paste-versus-file behavior and a short accessible-alt example; verify the documented steps in the CMS preview.

## 5. Project independent language versions to the public site

- [x] 5.1 Apply one locale-eligibility predicate across static routes, English and Portuguese blog indexes/search, sitemap, canonical/hreflang, cards and article switches; test PT-only, EN-only, bilingual and one-locale withdrawal with no cross-language prose fallback.
- [x] 5.2 Show and sort each locale by its own immutable first-publication commit instant or reviewed legacy pin, with separate modification metadata; verify a Portuguese article published today and translated to English two weeks later is newly featured on the English home page while its Portuguese date and position remain unchanged.
- [x] 5.3 Keep the English home page and `/blog/` English-only, preserve existing URLs and search-query safety, and ensure draft-only content/media never enters the static export; verify direct navigation, search, language switching, 404 and SEO metadata with fixture-based export tests.
- [x] 5.4 Update the visitor-facing behavior notes and test matrix for single-language articles, later translations and date semantics.

## 6. Replace polling with verified, quiet push releases

- [x] 6.1 Add a conservative public-output fingerprint to preflight, covering public code/config, eligible localized content and referenced media bytes, with backward-compatible reading of old release state; test unchanged drafts, same-slug edits, added translation, withdrawals and unknown-path fallback to deploy.
- [x] 6.2 Remove only the site-release 15-minute schedule and Scheduled status after the new CMS/editor is viable; retain `push` to `main`, manual recovery, OIDC scope, freshness checks, serialized mutations and the unrelated Pi image updater/retention workflow. Verify the workflow triggers and job conditions statically.
- [x] 6.3 Make draft-only pushes exit after a concise verified preflight without build/upload/invalidation, while public changes and manual recovery use the full release path; exercise workflow fixtures for no-op, failed validation, withdrawal and forced recovery.
- [x] 6.4 Document the new commit-driven publication and manual recovery procedure, including the absence of scheduled publishing; verify the instructions against the final workflow file.

## 7. Stage the migration and production cutover

- [x] 7.1 Build and test the Portuguese-first ARM64 CMS image against migrated fixtures, without changing the running Pi editor; retain the last working image and verify that only the dedicated stack would change, never Overleaf or its tunnel.
- [x] 7.2 Run an idempotent migration dry run from legacy fields to root title plus `editorial.pt`/`editorial.en`, review any scheduled or invalid published records with Lucas, and compare before/after public routes, dates, content hashes, home feature, search, sitemap and media; record approved legacy date pins and creation-date fallbacks before any commit. Lucas approved keeping the CWES `2026-10-09T18:00:00.000Z` pin in both languages and dropping stale dates from the unpublished placeholder draft.
- [x] 7.3 During the approved short maintenance window, pause only the dedicated CMS editor, preserve the active S3 release state, commit the reviewed content migration once and switch to the pretested new CMS image as one controlled cutover; then release the push-driven site and verify editor health/authentication and CloudFront routes. Preserve unrelated worktree changes and existing S3 rollback snapshots.
- [x] 7.4 Document cutover and rollback paths for failures before and after schema migration, explicitly avoiding a rollback to the obsolete English-first editor after new-format records exist; rehearse a non-destructive recovery check. If failure occurs before migration, restore the old image; after new-format saves, recover with the new compatible image or pause editing while repairing it.

## 8. End-to-end acceptance and OpenSpec reconciliation

- [ ] 8.1 Run unit, editor, static-export and security tests covering Portuguese-first creation, paste/GIF, English-later publication dates, same-slug edits, partial withdrawal and draft-only no-op; resolve failures without weakening validation.
- [ ] 8.2 Measure representative mobile and desktop performance/accessibility, including reduced motion, image loading and GIF controls; inspect exported MIME/cache headers and verify the live English home, blog, article and 404 routes after release.
- [x] 8.3 Reconcile and sync earlier unsynchronized OpenSpec deltas in chronological order, then sync this change's final specs and validate that the main specs no longer require English-first authoring or scheduled publication.
