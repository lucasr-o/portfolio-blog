# Tasks

## 1. Editorial contract and browser authoring

- [x] 1.1 Extend the shared post validator/serializer with optional `pt` fields and a default-unapproved state, preserving existing English YAML records; verify unit tests for old records, partial translation round-trip, approved complete translation, and field-specific errors for invalid approval.
- [x] 1.2 Derive English and Portuguese eligibility from one publication cutoff and shared parent status; verify selector tests for English-only, bilingual, draft, scheduled/future, withdrawal and stable sorting without duplicate logical posts.
- [x] 1.3 Expose Portuguese title, summary, raw Markdown, optional tags/cover alt and explicit publish control in the existing Keystatic collection; verify a locally saved partial translation reopens as source Markdown and does not alter the English slug.
- [x] 1.4 Document the translation workflow and the distinction between saved public-repository drafts and published site content in the CMS operating guide; verify the instructions against the actual editor fields and preview flow.

## 2. Public locales and reader experience

- [x] 2.1 Add locale-specific presentation projections, UI strings, date formatting and reading-time labels shared by index, preview cards and articles; verify unit/component tests show no English prose fallback in a Portuguese article or card.
- [x] 2.2 Reorganize public layouts so exported English and Portuguese pages emit correct initial `<html lang>` while keeping shared chrome, home route and 404 behavior; verify a static build and direct/refresh requests for `/`, `/blog/`, `/pt/blog/` and unknown paths.
- [x] 2.3 Render the Portuguese index and eligible article routes, plus a compact accessible EN/PT choice on both indexes and bilingual articles; verify browser tests for same-post switching, locale-correct back links, empty Portuguese index, English-only articles, keyboard focus and 320-pixel layout.
- [x] 2.4 Keep Latest Writing on the English homepage sourced from the same English publication record; verify its existing title, summary and link remain unchanged when a Portuguese translation is added.

## 3. Protected preview and editorial media

- [x] 3.1 Add English/Portuguese views to the saved GitHub-revision preview, including partial-translation feedback; verify CMS preview tests for same revision, protected/no-index responses, missing fields and safe Markdown rendering.
- [x] 3.2 Include media referenced by both published bodies, exclude media referenced only by unapproved Portuguese text, and render locale-specific alt text; verify media tests for shared cover, Portuguese-only inline image, unpublished image exclusion and invalid reference handling.
- [x] 3.3 Update the CMS operating guide with bilingual saved-preview and image-alt instructions; verify its examples match the implemented editor and preview labels.

## 4. Discovery and release safeguards

- [x] 4.1 Generate localized titles/descriptions, self-canonicals, reciprocal `hreflang`, OG locale, article `inLanguage` and sitemap alternates only for public versions; verify SEO/export tests for bilingual and English-only posts, including initial HTML without client JavaScript.
- [x] 4.2 Extend static build cleanup and publication audit for empty Portuguese collections, reserved not-found paths, withdrawn translations and Portuguese text in HTML/payloads/sitemap; verify export-fixture tests find no leaked route, text or media while the English article remains public.
- [x] 4.3 Update release manifest/smoke checks to include the Portuguese index and an approved Portuguese article when present, without changing CloudFront routing or OAC; verify release tests accept English-only builds and reject missing/mis-typed Portuguese production objects.

## 5. Cross-system verification

- [x] 5.1 Run the full unit, lint, static export, publication audit, browser accessibility/SEO and mobile visual checks with English-only and bilingual fixtures; verify all pass and confirm no production push or AWS/CMS mutation occurs during planning or local verification.
