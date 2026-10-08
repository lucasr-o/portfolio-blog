# Spec Delta

## MODIFIED Requirements

### Requirement: Search metadata
Each public route SHALL provide a unique title, description, canonical URL and social sharing metadata appropriate to its content, using `https://lucas-reis.com` as the canonical origin. Localized blog routes SHALL set the document language and expose their own localized metadata, canonical URL and article structured data; public English/Portuguese article counterparts SHALL have reciprocal language-alternate annotations. Numbered archive pages SHALL use self-canonical URLs and appear in the sitemap only when they exist. Query-based search views SHALL not be separate sitemap entries and SHALL retain the first index page as canonical. The site SHALL expose crawl directives and a sitemap containing only eligible public versions. Drafts, future-dated articles, unapproved or incomplete translations, and administrative routes SHALL NOT appear in public discovery metadata.

#### Scenario: Search crawler requests a route
- **WHEN** a crawler requests `/`, `/blog`, `/pt/blog`, an eligible numbered archive page or an eligible article URL
- **THEN** initial HTML contains that route's primary content and route-specific metadata without client-side script execution, with canonical and social URLs on `lucas-reis.com`

#### Scenario: Numbered and queried archive is inspected
- **WHEN** a second archive page exists and a visitor opens it or adds a `q` search parameter
- **THEN** the numbered page has its own canonical and sitemap entry, while a query-based result view does not create another public discovery route

#### Scenario: Localized article is inspected
- **WHEN** both versions of an article are public
- **THEN** the English and Portuguese pages declare the correct HTML language, use their own localized title and summary, and reference each other as language alternates without canonicalizing one language to the other

#### Scenario: Only English article exists
- **WHEN** an English article has no eligible Portuguese version
- **THEN** its public metadata and sitemap do not claim a Portuguese article counterpart

#### Scenario: Structured data is inspected
- **WHEN** structured data on the home page and either article locale is parsed
- **THEN** it describes Lucas Reis as a Person on the home page and the displayed article as a BlogPosting with matching author, localized title, language, dates and canonical origin on the article page

#### Scenario: Editorial states differ
- **WHEN** the repository contains published, draft and future-dated articles plus unfinished translations
- **THEN** the public sitemap and discoverable article metadata contain only eligible published article versions used by the pages

#### Scenario: Administrative preview is inspected
- **WHEN** an authorized author opens an administrative preview in either language
- **THEN** it requests no indexing and is not listed in the public sitemap or linked as a public canonical route

### Requirement: Performance-conscious delivery
The site SHALL statically deliver its primary content, reserve layout space for media, avoid unnecessary third-party client scripts, and defer non-critical work so the initial page remains fast and visually stable. The full-text search data SHALL not be required to load the ordinary blog index or numbered archive pages; it SHALL be requested only when search is used, and SHALL remain bounded and efficient as the archive grows.

#### Scenario: Production build is evaluated
- **WHEN** each public route is evaluated under a consistent mobile Lighthouse profile
- **THEN** it scores at least 90 in Performance, Accessibility, Best Practices, and SEO with no layout shift caused by unreserved page media

#### Scenario: Reader browses without searching
- **WHEN** a visitor opens a blog archive page and does not submit a query
- **THEN** its initial HTML already contains the six-or-fewer public previews and the full-text search artifact is not downloaded

## ADDED Requirements

### Requirement: Safe and accessible blog discovery controls
Search and pagination controls SHALL use keyboard-operable native elements, visible focus, clear accessible names, localized status/error text and a layout usable at 320 CSS pixels and 200 percent zoom. Query and page parameters SHALL be bounded and interpreted as inert data; the interface SHALL NOT execute query content, compile it as a regular expression, interpolate it as HTML, or use it to construct an arbitrary fetch or article URL. Search artifacts SHALL contain only publication-eligible versions.

#### Scenario: Malicious-looking query is opened
- **WHEN** a visitor opens a URL containing HTML, script-like text, encoded control characters, an oversized `q`, or a malformed `page` value
- **THEN** the query remains inert, the page renders without script execution or untrusted navigation, and pagination remains on a valid page

#### Scenario: Reader uses keyboard or a narrow viewport
- **WHEN** a visitor searches, clears the field, opens an article, or moves through numbered pages by keyboard at 320 CSS pixels or 200 percent zoom
- **THEN** every control has an accessible name and visible focus, remains reachable without horizontal clipping, and the current page is identifiable without color alone

#### Scenario: Reduced motion is requested
- **WHEN** `prefers-reduced-motion: reduce` matches during search or pagination
- **THEN** state and results remain understandable without relying on animation
