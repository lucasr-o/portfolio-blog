# Design

## Context

See [proposal.md](proposal.md) for motivation and the two delta specs for observable behavior. The public site uses Next.js 16.3.6, React/JavaScript, CSS Modules and `output: "export"` on private S3 behind CloudFront. `getPublicContent()` supplies one release-time snapshot with sorted English `posts`, eligible Portuguese `ptPosts` and media; the homepage and both blog indexes currently consume that snapshot. The installed Next guide permits build-time `generateStaticParams` but treats page `searchParams` as request-time rendering, so the static site cannot filter arbitrary `?q=` values on the server. The release manifest already classifies JSON as a mutable public asset, and the publication audit scans exported JSON. The annexed Tailwind/TypeScript/shadcn examples are interaction references; this project has no such design system, and copying those dependencies would enlarge the change without improving the user flow.

## Goals / Non-Goals

**Goals:** Keep ordinary archive browsing fully present in initial HTML and usable without search JavaScript; make full-text search work from a shared URL without a visitor-time server; preserve per-locale publication eligibility and predictable SEO; keep controls compact, keyboard-accessible and safe at 320 pixels.

**Non-Goals:** Add a search backend, search drafts or another language from the current locale, translate article bodies, introduce Tailwind/shadcn/TypeScript, create tag taxonomy pages, or give query results their own indexable canonical URLs.

## Decisions

### 1. Static numbered archives, one locale at a time

Keep page one at each current index URL. Generate only pages 2..N at `/blog/page/N/` and `/pt/blog/page/N/`, using six posts per page from the same sorted publication arrays. Generate route metadata and sitemap entries for pages that exist; page two becomes a real HTTP 404 after a release that removes it. The first eligible post is featured only on page one. The language switch always points to the other locale's first page; an equivalent page number may not exist there. Numbered links, previous/next controls and ellipses use native anchors, `aria-current="page"`, visible focus and a narrower mobile arrangement; no pagination library is needed. If Next requires a sentinel parameter for an empty generated route, use the existing `__empty__` cleanup/audit pattern so no sentinel is deployed.

Alternative considered: one client-side archive page with `?page=` only. That would make older posts absent from initial HTML, weaken direct-link and crawler behavior, and ship more preview data to every reader.

### 2. A lazy, release-time full-text index

After Next's export, build one same-origin JSON search artifact per locale from the already selected public snapshot. Store only result-card metadata and an inverted term-to-document map—not raw bodies—while tokenizing each complete Markdown body, title, summary and tags. Fold case and accents, combine multiple query terms with AND, and accept whole-word and short prefix matches to keep keyword behavior forgiving. Deduplicate terms per article, preserve the publication order of matching results, enforce a measured artifact-size budget, and have the existing publication audit reject draft/unapproved markers in these JSON files. The archive requests its locale's JSON only after a nonempty search; ordinary pages never download it. Release upload treats the JSON as mutable with its existing correct content type and CloudFront invalidation.

Alternative considered: embedding complete bodies in each page or adding a hosted search service. The first increases every visit's bytes and risks exposing unapproved text; the second adds cost, operational dependency and a new trust boundary for a low-traffic static site.

### 3. URL-backed search without treating input as code

A small client boundary enhances a native, labeled search form on both locales. Submitting on a numbered archive goes to that locale's first index page; a nonempty `q` there loads the search artifact and replaces the archive preview list with localized results. Search-result pages use `?q=<encoded>&page=N`, six hits per page, while clearing the field returns to the unfiltered first page. A direct URL or refresh takes the same path. Use `URLSearchParams` and bounded Unicode normalization for `q`, parse `page` as a safe positive integer and clamp it to available results. Never turn the query into HTML, a user-supplied regular expression, an arbitrary fetch URL or an article path; render it and result metadata through React text nodes. Provide loading, no-match and fetch-error/retry states, with native keyboard-operable buttons. Query views inherit page one's canonical metadata and are not added to the sitemap.

Alternative considered: client-side live filtering on every keystroke. Submit-driven search avoids repeated full-index work and URL churn while retaining a fast local result once the index is cached. If search-as-you-type is wanted later, the index and result model can be reused.

### 4. Broad copy within the existing visual system

Use “Posts.” / “Artigos.” as concise provisional H1 text and widen the intro/description/OG copy to security, technology and other worthwhile topics. Retain the `Application Security Engineer` identity on the portfolio and existing article content. Adapt the annexed input and pagination composition to existing neutral surfaces, tertiary-blue focus/hover and CSS Modules. Do not add a new button library, font or icon package; `lucide-react` is already installed. The clear control remains in the tab order and has a localized accessible name, unlike the sample's `tabIndex=-1`.

Alternative considered: importing the samples literally. Their TypeScript, Tailwind tokens and shadcn dependencies do not match this repository and their hidden clear button focus would not meet the project's accessibility contract.

## Risks / Trade-offs

- [A request-time `searchParams` read breaks static export] → Parse the query in the small client boundary only; test a direct query URL, refresh and S3/CloudFront-style static preview.
- [Generated page route or sentinel leaks after shrinking an archive] → Build from one publication cutoff, remove reserved output, assert release manifest and sitemap contain only existing pages, and test withdrawal with seven-to-six posts.
- [Search index leaks draft or unapproved Portuguese content] → Derive from `publication.posts`/`ptPosts` only, scan exported JSON in the existing audit and include draft/future/translation canaries in fixture builds.
- [Arbitrary query causes XSS, regex slowdown, unsafe links or huge work] → Bound length and term count, use Unicode token lookup and React escaping, construct only fixed local index paths and validated article slugs; test encoded payloads and malformed pages.
- [Large archives slow the first search] → Lazy-load the compact inverted index, set a build-time size budget with an actionable failure, and test that a no-search visit makes no index request.
- [Client search on a deep link briefly shows the unfiltered archive] → Render a clear loading state as the client reads `q`; verify no misleading result count or flash during hydration and use a native form fallback for navigation.

## Migration Plan

1. Preserve existing post YAML and article URLs. Add pure pagination and search-index functions/tests before changing routes; fold in the two already-started local helper files only after the planning artifacts are accepted.
2. Add the build artifact, static page routes, localized copy and client search controls. Verify an English-only collection, an empty Portuguese collection and a larger bilingual fixture, including direct refresh, SEO, mobile and hostile queries.
3. Run lint, unit, static export/audit, browser accessibility/SEO and bundle/Lighthouse checks before any push. A later authorized push uses the existing release workflow; no AWS/DNS/CMS mutation is needed. If the release fails, the current snapshot remains; if it regresses after deployment, restore the previous S3 snapshot through the existing rollback workflow.
