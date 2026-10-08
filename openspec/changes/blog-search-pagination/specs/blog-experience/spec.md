# Spec Delta

## MODIFIED Requirements

### Requirement: Blog index
The site SHALL provide an English blog index at `/blog` and a Portuguese blog index at `/pt/blog`. Each index SHALL introduce the writing area with broad “posts”/“artigos” language rather than restricting the blog to application security, and SHALL list only article versions eligible for publication at the release instant. Previews SHALL remain ordered by shared publication date descending with a deterministic slug tie-breaker, and SHALL use each version's title, summary, localized date, reading time, labels and working article link. The newest eligible article on the first archive page in each locale SHALL receive featured treatment.

#### Scenario: Visitor opens the blog index
- **WHEN** a visitor opens `/blog` with the migrated placeholder in the published collection
- **THEN** the page displays a broad English primary heading and the placeholder preview with a working link to its preserved English article URL

#### Scenario: Visitor opens the Portuguese blog index
- **WHEN** the published collection includes English-only articles and articles with approved Portuguese versions
- **THEN** `/pt/blog` displays a broad Portuguese primary heading and only approved Portuguese previews, without English-only cards or unavailable article links

#### Scenario: Visitor sees the newest post first
- **WHEN** either locale has one or more eligible articles
- **THEN** its newest eligible article appears first and receives featured treatment on page one, excluding drafts, future-dated articles and unavailable translations

#### Scenario: No articles are publishable in one locale
- **WHEN** the Portuguese collection is empty even though English articles exist
- **THEN** the Portuguese index displays an intentional Portuguese empty state without broken previews or a rendering failure

## ADDED Requirements

### Requirement: Numbered blog archive
Each locale's eligible posts SHALL be split into static archive pages of at most six previews. Page one SHALL retain `/blog/` or `/pt/blog/`; page N greater than one SHALL use `/blog/page/N/` or `/pt/blog/page/N/`. Only existing numbered pages SHALL be published. Navigation SHALL expose working previous/next and numbered links, mark the current page without relying on color alone, and use ellipses when the total is too large to display all page numbers. It SHALL be absent when there is only one page. The index language choice SHALL go to page one of the selected locale, because page counts can differ.

#### Scenario: Archive grows past six posts
- **WHEN** one locale has seven eligible articles
- **THEN** page one shows the first six, page two shows the seventh, both routes render directly on refresh, and their navigation links move between them

#### Scenario: Archive is small
- **WHEN** a locale has six or fewer eligible articles
- **THEN** its first page shows them all, no pagination control appears, and `/page/2/` returns HTTP 404

#### Scenario: A publication is withdrawn
- **WHEN** withdrawal reduces a locale's page count
- **THEN** the next successful release removes now-nonexistent numbered pages and links, while unaffected article routes remain available

### Requirement: Full-text blog search
Each blog locale SHALL offer a labeled keyword search over the title, summary, tags and complete Markdown body of every eligible article version in that locale, not merely the visible archive page. Search SHALL be case- and accent-insensitive, treat multiple keywords as a combined filter, preserve the query in a shareable `q` URL parameter, and return localized result previews in the archive's stable newest-first order. Search results SHALL have their own six-item pagination using a query `page` parameter when needed, with an obvious clear action, an intentional no-results state, and a retry path if the search index cannot load. An empty or cleared query SHALL return to the unfiltered first archive page.

#### Scenario: Match occurs only in the article body
- **WHEN** a visitor searches for a term appearing in a published article's Markdown body but not its title, summary or tags
- **THEN** that article is found even if it was not on the initially visible archive page

#### Scenario: Search is shared and refreshed
- **WHEN** a visitor opens `/blog/?q=cryptography` or `/pt/blog/?q=criptografia` directly or refreshes it
- **THEN** the same locale-specific results and query appear after the search index loads, and result page links preserve the query

#### Scenario: Language choice is used during search
- **WHEN** a visitor switches EN/PT while a search is active
- **THEN** the destination is the other locale's unfiltered first index page, not a missing equivalent result page

#### Scenario: No results or search data unavailable
- **WHEN** no eligible article contains the requested keywords, or the search index request fails
- **THEN** the interface distinguishes no matches from load failure and offers a clear or retry action respectively

#### Scenario: Unpublished translation contains a match
- **WHEN** a keyword exists only in a draft, future-dated post or unapproved Portuguese version
- **THEN** it does not appear in public search results or the public search artifact
