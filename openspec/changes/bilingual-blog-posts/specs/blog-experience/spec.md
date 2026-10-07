# Spec Delta

## MODIFIED Requirements

### Requirement: Blog index
The site SHALL provide an English blog index at `/blog` and a Portuguese blog index at `/pt/blog`. Each index SHALL introduce the writing area in its own language and list only article versions eligible for publication at the release's publication instant, ordered by shared publication date descending with a deterministic slug tie-breaker. Each preview SHALL use that version's title, summary, publication date format, reading time, labels and working article link. The newest eligible article in each locale SHALL receive featured treatment.

#### Scenario: Visitor opens the blog index
- **WHEN** a visitor opens `/blog` with the migrated placeholder included in the published collection
- **THEN** the page displays its own primary heading and the placeholder preview with a working link to its preserved English article URL

#### Scenario: Visitor opens the Portuguese blog index
- **WHEN** the published collection includes English-only articles and articles with approved Portuguese versions
- **THEN** `/pt/blog` lists only the approved Portuguese versions, with no English-only cards or links to unavailable Portuguese articles

#### Scenario: Visitor sees the newest post first
- **WHEN** either locale's published collection contains one or more articles
- **THEN** that locale's newest eligible article receives featured treatment before older previews, excluding drafts, future-dated articles and unavailable translations

#### Scenario: No articles are publishable in one locale
- **WHEN** the Portuguese collection is empty even though English articles exist
- **THEN** the Portuguese index displays an intentional Portuguese empty state without broken previews or a rendering failure

### Requirement: Individual blog post
The site SHALL statically provide every eligible English article at `/blog/<slug>` and every eligible Portuguese version at `/pt/blog/<slug>`. Each article SHALL show one primary heading, publication metadata, locale-specific summary, rendered Markdown body, reading time and author attribution. The migrated placeholder's English URL SHALL remain available while that record is published. Article content SHALL remain free from scroll-reveal effects, and the renderer SHALL not execute author-supplied HTML or MDX.

#### Scenario: Visitor opens the placeholder post
- **WHEN** a visitor follows the migrated placeholder post link from `/blog`
- **THEN** the English article displays readable content and metadata matching its index preview, with a placeholder indication belonging to that record rather than every article template

#### Scenario: Reader opens an approved Portuguese Markdown article
- **WHEN** the approved version contains headings, lists, links, images, blockquotes, tables and fenced code
- **THEN** its initial HTML contains the Portuguese article content and metadata matching its Portuguese index preview, with safe semantic Markdown output and preserved code formatting

#### Scenario: Article contains unsafe content
- **WHEN** source Markdown in either language contains scripts, event handlers or executable link protocols
- **THEN** neither the public renderer nor administrative preview executes that content

#### Scenario: Article version is not eligible
- **WHEN** a visitor requests a draft, future-dated or unapproved Portuguese article version
- **THEN** that version has no public static page in the release and the public host returns HTTP 404

### Requirement: Blog navigation continuity
Both blog indexes and every public article SHALL preserve the shared top navigation and provide a clear route back to the corresponding language's blog index. Each blog index SHALL expose an accessible EN/PT language choice that links to the other index. An article SHALL offer a switch to its counterpart only when that counterpart is public; it SHALL not switch to an unrelated article or an unavailable route.

#### Scenario: Reader returns to the index
- **WHEN** a reader activates the back-to-blog link from an English or Portuguese article
- **THEN** the reader is navigated to `/blog` or `/pt/blog`, respectively

#### Scenario: Reader switches a bilingual article
- **WHEN** a reader selects the other language on an article that has two public versions
- **THEN** the destination is the same article in the selected language and the current language remains identifiable without relying on color alone

#### Scenario: Reader opens an English-only article
- **WHEN** the Portuguese version of an English article is not public
- **THEN** the article does not offer a broken Portuguese article link

#### Scenario: Reader chooses a portfolio section from a blog page
- **WHEN** a reader activates Work, About, or Contact from either blog locale
- **THEN** the reader is navigated to the corresponding anchored section on `/`
