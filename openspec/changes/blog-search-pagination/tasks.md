# Tasks

## 1. Publication data and search artifact

- [x] 1.1 Finish the pure pagination and full-text search helpers begun locally: six-item slicing, compact ellipsis ranges, bounded/normalized query handling, combined keyword matches, safe page parsing and locale URLs; verify unit tests for boundaries, accents, prefix/body-only hits, malformed input and injection-like strings.
- [x] 1.2 Generate compact per-locale public search JSON only from the shared eligible publication snapshot after static export, enforce an actionable size budget, and include it in the existing audit/release artifact; verify fixture builds exclude draft, future and unapproved Portuguese markers from JSON while retaining published body-only matches.
- [x] 1.3 Extend release checks to recognize the search artifacts' JSON content type and availability without changing AWS routing; verify release-plan/smoke tests pass for English-only and bilingual builds and fail on missing or incorrectly typed search JSON.

## 2. Static archive pages and navigation

- [x] 2.1 Add statically generated `/blog/page/N/` and `/pt/blog/page/N/` routes for existing pages only, preserving the first-page URLs and newest-first ordering; verify an export fixture with seven-plus posts creates page two, and shrinking to six removes it and returns HTTP 404.
- [x] 2.2 Add localized titles/descriptions, self-canonicals and sitemap entries for numbered routes without false EN/PT page alternates; verify metadata/SEO tests on English, Portuguese, empty and withdrawn archives.
- [x] 2.3 Add native-link pagination with previous/next, bounded page numbers, ellipses, current-page state and narrow-width styling that appears only for multiple pages; verify keyboard focus, 320-pixel and 200%-reflow browser tests, including switching locales from a numbered page.

## 3. Reader search and broad blog copy

- [x] 3.1 Replace AppSec-only blog headings/intros and related SEO copy with broad “Posts.” / “Artigos.” language while preserving article and portfolio identity; verify English/Portuguese page and metadata tests use the final text.
- [x] 3.2 Add a labeled search form based on the attached input interaction, lazy same-origin index loading and URL-backed result pagination for `q`/`page`; verify browser tests for body-only matches beyond the visible page, refresh/deep-link, localized results, clear, no matches and failed-index retry.
- [x] 3.3 Harden the search UI so arbitrary, oversized and encoded URL input stays inert, cannot drive a regex/fetch/HTML/unsafe link, and never exposes unpublished records; verify hostile-query browser tests, source assertions and publication canaries.
- [x] 3.4 Document how full-text search and static pagination behave in the site's content/operations guide, including the difference between saved CMS drafts and searchable public posts; verify documented URLs and steps against the implemented interface.

## 4. Cross-system verification

- [x] 4.1 Run lint, full unit tests, static export/publication audit, English-only and bilingual browser/SEO/accessibility checks, bundle audit and mobile Lighthouse/visual review; verify the ordinary index does not request search JSON, all affected routes meet the existing quality thresholds, and no production push or AWS/CMS mutation occurs during local verification.
