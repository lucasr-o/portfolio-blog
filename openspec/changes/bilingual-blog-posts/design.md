# Design

## Context

See [proposal.md](proposal.md) for motivation and the delta specs for behavior. The current public app is Next.js 16.3.6 with `output: "export"` and `trailingSlash: true`; S3/CloudFront serves build artifacts, while a separate Keystatic app edits YAML under `content/posts/*` in GitHub. One record currently has one English `title`, `summary` and raw Markdown `body`. `packages/blog-content/model.js` validates records, `publication.js` selects eligible posts, and the same snapshot feeds the home feature, `/blog`, article routes, sitemap and media manifest. The current root layout emits `<html lang="en">`. The active `portfolio-blog` change originally excluded translation and is not yet archived; implement this extension against the resulting code and reconcile spec synchronization before archiving either change.

## Goals / Non-Goals

**Goals:** Preserve all current English URLs and source records, make translation publication an explicit editorial decision, and derive all locale surfaces from one build-time publication snapshot. Keep switching fast, keyboard-accessible and independent of visitor-time CMS access.

**Non-Goals:** Translate the portfolio/homepage, machine-translate or auto-detect browser language, create locale-specific slugs, offer independent publication dates for translated versions, or add a live API/translation dependency to the public site.

## Decisions

### 1. Extend each YAML record, do not create a second post

Keep the existing top-level fields as English to preserve the current placeholder, slug and links without a bulk migration. Add an optional nested `pt` section with `publish` defaulting to false, `title`, `summary`, raw Markdown `body`, optional localized tag labels, and a localized cover alt when the shared cover is used. Shared slug, author, publication timestamps, image inventory and editorial status remain at the record level. Use the same slug under `/pt/blog/<slug>/`; the Portuguese title does not silently rename a public URL.

The public selector first decides whether the parent English post is eligible using the existing cutoff. It then creates a Portuguese presentation only if `pt.publish` is true and the Portuguese fields pass validation. Saving partial `pt` fields is permitted while `pt.publish` is false; attempting to publish an invalid translation fails the build with `pt.<field>` errors instead of hiding a failed editorial action. If a translated article's shared English parent is a draft or future-dated, neither version is public. Reading time is calculated separately from each body; dates represent the same instant but use `en` and `pt-BR` formatting. If localized tags are absent, the Portuguese page omits tag chips rather than falling back to English prose. Markdown image alt text is authored in each body; a shared cover requires Portuguese alt text when the translation is published.

Alternative considered: one YAML file per language. That would duplicate publication state, dates and image ownership, create two featured/latest candidates for one article, and require cross-record synchronization. A nested optional version is simpler for this single-author blog. The existing public GitHub repository still exposes saved draft translations in repository history; the editor must keep explaining that public-site invisibility is not GitHub confidentiality.

### 2. Use stable static URLs and real links for switching

Retain `/blog/` and `/blog/<slug>/` as English. Add `/pt/blog/` for a Portuguese index even when it is empty, plus `/pt/blog/<slug>/` only for approved public translations. The index switch always links between indexes. Article switches link to the same slug's counterpart only when it exists; an English-only article has no dead PT action. The visible control uses native links, an identifiable current-language state, visible focus, sufficient contrast and no forced animations; no JavaScript-only content replacement, query parameter, locale cookie or implicit redirect is needed.

The index, `PostPreview` and shared `Article` receive a locale-specific projection and a small UI-string dictionary. Translate headings, empty state, `Latest`, `Read article`, back link, placeholder label, date, reading-time suffix, author label and accessible names, not just title/body. The English homepage continues to show the latest English post. Existing article scroll-reveal remains disabled. Missing Portuguese versions never appear as English cards on the Portuguese index.

Alternative considered: a client-side switch at one URL. It would make initial HTML, refreshes, sharing, canonicals and search indexing ambiguous and would require shipping both bodies to a visitor. Static per-language routes match the deployed architecture.

### 3. Set document language in initial HTML

The current top-level `app/layout.jsx` fixes `lang="en"`; a nested layout cannot override the document's `<html>` element. Reorganize the public routes into English and Portuguese route groups with locale-specific root layouts, sharing the background, reveal bootstrap, skip-link and global styles rather than duplicating their behavior. The Portuguese root emits `lang="pt-BR"`; the English root remains `lang="en"`. Next's route-group model may make a transition between root layouts a full page load; this is acceptable for two small static blog locales, but test navigation and focus after switching. Preserve `/` and existing English paths. Keep the static 404 behavior and verify export with the installed Next version before deployment.

Alternative considered: changing `<html lang>` after hydration. That leaves incorrect language in initial HTML and is unsuitable for accessibility and SEO.

### 4. Keep publishing and discovery version-aware

Derive English and Portuguese public lists from the same `publicationTime`. Use the Portuguese projection consistently for `/pt/blog`, article HTML, OG metadata (`pt_BR`), canonical URL, `BlogPosting.inLanguage`, summary, keywords and media. English URLs remain self-canonical; Portuguese URLs are self-canonical. Add reciprocal `hreflang` for the always-present indexes and only for article pairs that both exist. Sitemap entries and alternate annotations follow those same pairs; never claim a missing counterpart. Preserve existing publication date and `updatedAt` for both versions in this MVP.

Scan Markdown references in both *public* bodies, plus public covers, to build the union of required image assets. Do not export an image referenced only by an unfinished Portuguese version. Keep media URLs content-hashed and resolve localized alt text from the rendered article, not a shared manifest's first-language alt value. Extend the release audit to detect excluded Portuguese routes/content in HTML, Next payloads and sitemap, while preserving draft/future checks. Withdrawal of `pt.publish` removes the old page and associated mutable payloads via the existing release manifest process, then CloudFront returns the configured 404.

Alternative considered: publish a Portuguese page containing English fallback fields. That would mislead readers, produce mixed-language cards and weaken the language metadata contract, so approval requires complete localized content.

### 5. Keep the saved CMS preview aligned with publication

Keystatic exposes the new fields in the existing collection, with source Markdown editing preserved. The protected preview offers English and Portuguese views from the same saved GitHub revision, including a partial Portuguese draft with clear missing-field feedback. Both views reuse the shared Markdown renderer and can resolve saved images before public deployment. Preserve HTTP Basic Auth, GitHub login, `no-store` and `noindex`; do not introduce a public preview endpoint or a visitor-time fetch to the Raspberry Pi. The editor should make the `publish` action explicit and indicate that saving is not equivalent to deploying.

Alternative considered: separate CMS collections. That would complicate cross-language pairing and saved-preview identity without helping this single-editor workflow.

## Risks / Trade-offs

- [Multiple root layouts can cause full reloads or accidental route/404 regressions] → Test direct requests, refreshes and internal navigation for `/`, both indexes, both article routes, assets and 404; keep the shared chrome equivalent and confirm `<html lang>` in exported HTML.
- [Old validators reject the new `pt` YAML key] → Deploy backward-compatible reader/editor support before saving translated records. Roll back public output from its previous S3 snapshot if needed; rolling back CMS code after `pt` records exist requires a compatible parser or reverting those content commits.
- [Partial translation leaks through another build surface] → Use one locale eligibility predicate and audit HTML, RSC/payloads, sitemap, media and preview boundaries with English-only and withdrawn-translation fixtures.
- [Translation published before editorial review] → Default `pt.publish` to false; block approval with missing title, summary, body or required alt instead of silently publishing a mixed-language page.
- [Repo-backed drafts are publicly readable on GitHub] → Retain the existing CMS warning; never describe private public-site routes as confidential source storage.

## Migration Plan

1. Add optional `pt` parsing with defaults and tests against the unchanged existing English YAML files; no content migration or English URL change.
2. Add locale projections, preview support and routes. Build and test with no approved translations: English pages must match current behavior and `/pt/blog/` must show its Portuguese empty state.
3. Add a complete bilingual fixture for local/export/SEO tests, including Markdown media, then test withdrawal and invalid approved data. Keep real placeholder content English-only until Lucas writes/approves a real translation.
4. Validate the production export and deployment audit; publish through the existing CI/CD path. CloudFront's generic path-to-`index.html` mapping already supports the new `/pt/.../` paths, so no DNS, OAC, bucket-policy or tunnel change is planned.
5. If release checks fail, leave production unchanged. If a deployed release regresses, restore the previous public snapshot and invalidate CloudFront using the existing rollback procedure; keep the CMS schema compatible with any already-saved `pt` fields.
