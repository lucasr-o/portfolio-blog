# Spec Delta

## MODIFIED Requirements

### Requirement: Blog index
The site SHALL provide a blog index at `/blog` that introduces the writing area and lists only articles eligible for publication at the release's publication instant, ordered by publication date descending with a deterministic slug tie-breaker. Each preview SHALL include title, summary, publication date, reading time and a working article link.

#### Scenario: Visitor opens the blog index
- **WHEN** a visitor opens `/blog` with the migrated placeholder included in the published collection
- **THEN** the page displays its own primary heading and the placeholder preview with a working link to its preserved article URL

#### Scenario: Visitor sees the newest post first
- **WHEN** the published collection contains one or more articles
- **THEN** the newest eligible article receives featured treatment before older previews, excluding drafts and future-dated articles

#### Scenario: No articles are publishable
- **WHEN** the published collection is empty
- **THEN** the blog index displays an intentional empty state without broken previews or a rendering failure

### Requirement: Latest post feature on the home page
The home page SHALL contain a `Latest Writing` feature derived from the newest eligible article in the same published collection used by the blog index, and SHALL omit that feature when no article is publishable.

#### Scenario: Visitor reviews the latest writing feature
- **WHEN** a visitor reaches the Latest Writing section on `/`
- **THEN** it displays the newest published article's title, summary, publication date, reading time and a working article link

#### Scenario: Blog content changes
- **WHEN** a newer eligible article is successfully deployed from the editorial collection
- **THEN** the home-page feature and featured blog-index entry both resolve to that article without separately maintained content

#### Scenario: Newest saved article is not public
- **WHEN** the most recent saved article is a draft or has a future publication date
- **THEN** the home feature continues to select the newest eligible published article or remains absent if none exists

### Requirement: Individual blog post
The site SHALL statically provide every eligible article at `/blog/<slug>` with a single primary heading, publication metadata, summary, rendered Markdown body and author attribution. The migrated placeholder URL SHALL remain available while that record is published. Article content SHALL remain free from scroll-reveal effects.

#### Scenario: Visitor opens the placeholder post
- **WHEN** a visitor follows the migrated placeholder link from `/blog`
- **THEN** the article displays readable content and metadata matching its preview, with a placeholder indication belonging to that record rather than every article template

#### Scenario: Reader opens a Markdown article
- **WHEN** an eligible article contains headings, lists, links, images, blockquotes, tables and fenced code
- **THEN** its initial HTML contains semantic readable output, preserves code formatting and contains no executable author-supplied HTML or MDX

#### Scenario: Article contains unsafe content
- **WHEN** source Markdown contains scripts, event handlers or executable link protocols
- **THEN** the public renderer and administrative preview do not execute that content

#### Scenario: Article is not yet eligible
- **WHEN** a visitor requests a draft or future-dated article
- **THEN** that article has no public static page in the release and the public host returns HTTP 404
