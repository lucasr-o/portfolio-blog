# Blog Experience Specification

## Purpose

Defines a focused writing experience where visitors can discover Lucas Reis's articles on any topic and read complete, well-structured posts in their available language.

## Requirements

### Requirement: Blog index
The site SHALL provide an English blog index at `/blog/` and a Portuguese blog index at `/pt/blog/`. Each SHALL introduce the writing area using broad “posts” or “artigos” language, list only versions public in that language, order them by that version's first-publication date descending with a deterministic slug tie-breaker, and show localized title, summary, date, reading time, labels, and a working article link. Search and pagination SHALL preserve that language filter. The newest eligible article on page one SHALL receive featured treatment.

#### Scenario: Visitor opens the blog index
- **WHEN** a visitor opens `/blog/` or `/pt/blog/`
- **THEN** the page displays its own primary heading, language choice, and links only to public articles in that language

#### Scenario: Visitor sees the newest post first
- **WHEN** a locale has one or more public articles
- **THEN** its newest eligible article appears first and receives featured treatment on page one

#### Scenario: Portuguese-only post exists
- **WHEN** a post is published only in Portuguese
- **THEN** it appears on `/pt/blog/` but not as a Portuguese-language card on `/blog/`

#### Scenario: No articles are publishable in one locale
- **WHEN** a locale has no public articles
- **THEN** its index displays an intentional localized empty state without broken previews

### Requirement: Latest post feature on the home page
The English home page SHALL contain a `Latest Writing` feature derived only from the newest public English version and linking to that article. Its text, date, reading time, and destination SHALL remain English when a newer Portuguese-only article exists.

#### Scenario: Visitor reviews the latest writing feature
- **WHEN** at least one English version is public
- **THEN** the home page shows its newest English title, summary, publication date, reading time, and working article link

#### Scenario: Blog content changes
- **WHEN** an English version with a newer English first-publication date becomes public
- **THEN** the home feature and English blog-index feature both resolve to it without duplicated content

#### Scenario: A newer Portuguese-only article is published
- **WHEN** a Portuguese-only article is newer than every public English article
- **THEN** the home feature remains on the newest available English article

#### Scenario: No English version is public
- **WHEN** no English version is public
- **THEN** the home page does not substitute Portuguese prose into its English feature

### Requirement: Individual blog post
The site SHALL statically provide each eligible English article at `/blog/<slug>/` and Portuguese article at `/pt/blog/<slug>/`, using that version's title, summary, first-publication date, optional modification date, Markdown body, media, reading time, and author attribution. Unavailable language versions SHALL have no public article page. Article bodies SHALL remain free from scroll-reveal effects and SHALL NOT execute author-supplied HTML or MDX.

#### Scenario: Visitor opens the placeholder post
- **WHEN** a visitor follows an eligible placeholder link from `/blog/`
- **THEN** its English article displays one primary heading, readable sections, and metadata matching the preview

#### Scenario: Visitor opens a public article
- **WHEN** a visitor follows an index or home-page link
- **THEN** the article displays readable body content and metadata matching its card and language

#### Scenario: Reader opens approved Markdown
- **WHEN** public Markdown contains headings, lists, links, images, blockquotes, tables, and fenced code
- **THEN** initial HTML contains safe semantic content with preserved code formatting

#### Scenario: Article contains unsafe content
- **WHEN** source Markdown includes scripts, event handlers, or executable link protocols
- **THEN** neither public rendering nor administrative preview executes them

#### Scenario: Visitor requests an unavailable version
- **WHEN** a visitor requests a draft, withdrawn, or never-published language route
- **THEN** the public host returns HTTP 404 without exposing its body in search, sitemap, or page payloads

#### Scenario: Article contains an animated image
- **WHEN** published Markdown references a validated GIF
- **THEN** the article reserves its layout dimensions and provides an accessible way to control playback

### Requirement: Blog navigation continuity
Both blog indexes and every public article SHALL preserve the shared top navigation and a clear link back to the corresponding language index. Each index SHALL expose an accessible EN/PT choice linking to the other locale's first index page. An article SHALL link to its counterpart only when that counterpart is public.

#### Scenario: Reader returns to the index
- **WHEN** a reader activates the back-to-blog link from an article
- **THEN** navigation reaches `/blog/` or `/pt/blog/` for its language

#### Scenario: Reader switches a bilingual article
- **WHEN** a reader selects another public language version
- **THEN** the destination is the same article in that language and the current language is identifiable without color alone

#### Scenario: Reader opens a single-language article
- **WHEN** the other language version is not public
- **THEN** no broken counterpart link is offered

#### Scenario: Reader chooses a portfolio section from a blog page
- **WHEN** a reader activates Work, About, or Contact from a blog route
- **THEN** navigation reaches the corresponding anchored section on `/`

### Requirement: Numbered blog archive
Each locale's eligible articles SHALL be split into static archive pages of at most six previews. Page one SHALL retain `/blog/` or `/pt/blog/`; page N greater than one SHALL use `/blog/page/N/` or `/pt/blog/page/N/`. Only existing numbered pages SHALL be published. Navigation SHALL expose working previous, next, and numbered links, identify the current page without color alone, and use ellipses when needed. It SHALL be absent with only one page.

#### Scenario: Archive grows past six posts
- **WHEN** a locale has seven eligible articles
- **THEN** page one shows six, page two shows one, both refresh directly, and navigation links move between them

#### Scenario: Archive is small
- **WHEN** a locale has six or fewer eligible articles
- **THEN** page one shows them all, no pagination appears, and `/page/2/` returns HTTP 404

#### Scenario: A publication is withdrawn
- **WHEN** withdrawal reduces a locale's page count
- **THEN** the next successful release removes obsolete numbered routes and links while unaffected articles remain

### Requirement: Full-text blog search
Each locale SHALL offer labeled keyword search over the title, summary, tags, and complete Markdown body of all its public article versions, beyond the visible archive page. Search SHALL be case- and accent-insensitive, combine multiple keywords, preserve the query in a shareable `q` parameter, and return localized previews in stable newest-first order. Search results SHALL have six-item query-based pagination when needed, a clear action, an intentional no-results state, and retry after index-load failure. Clearing the query SHALL return to the unfiltered first page.

#### Scenario: Match occurs only in the article body
- **WHEN** a keyword appears only in a public article's Markdown body
- **THEN** that article is found even if it is absent from the initial archive page

#### Scenario: Search is shared and refreshed
- **WHEN** a visitor directly opens or refreshes a `q` URL
- **THEN** the same locale's results and query appear after index load and result links preserve the query

#### Scenario: Language choice is used during search
- **WHEN** a visitor switches EN/PT during search
- **THEN** the destination is the other locale's unfiltered first page

#### Scenario: No results or search data unavailable
- **WHEN** no public article matches or the search artifact cannot load
- **THEN** the interface distinguishes no matches from load failure and offers clear or retry respectively

#### Scenario: Unpublished version contains a match
- **WHEN** a keyword exists only in a draft or unapproved language version
- **THEN** it does not appear in search results or public search artifacts
