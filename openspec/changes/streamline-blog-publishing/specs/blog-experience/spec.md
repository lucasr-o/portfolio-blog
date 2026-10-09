# Spec Delta

## MODIFIED Requirements

### Requirement: Blog index
The site SHALL provide an English blog index at `/blog/` and a Portuguese blog index at `/pt/blog/`. Each index SHALL list only versions published in that language, ordered by that version's first-publication date descending, and show localized title, summary, publication date and reading time. Search and pagination SHALL preserve the same language filter, and each index SHALL remain usable when no version in that language is public.

#### Scenario: Visitor opens the blog index
- **WHEN** a visitor opens `/blog/` or `/pt/blog/`
- **THEN** the page displays its own primary heading, language choice and working links only to public articles in that language

#### Scenario: Visitor sees the newest post first
- **WHEN** the selected language contains one or more public posts
- **THEN** the post with the newest first-publication date in that language receives the featured treatment before older previews

#### Scenario: Portuguese-only post exists
- **WHEN** a post is published only in Portuguese
- **THEN** it appears on `/pt/blog/` but not as a Portuguese-language card on `/blog/`

### Requirement: Latest post feature on the home page
The English home page SHALL contain a `Latest Writing` feature derived only from the newest public English version and linking to that English article. Its text, date, reading time and destination SHALL remain English even when a newer Portuguese-only article exists.

#### Scenario: Visitor reviews the latest writing feature
- **WHEN** at least one English version is public
- **THEN** the home page displays the newest English version's title, summary, English publication date, reading time and working English article link

#### Scenario: Blog content changes
- **WHEN** an English version with a newer English first-publication date becomes public in the content collection
- **THEN** the home-page feature and featured English blog-index entry both resolve to that version without separate duplicated content

#### Scenario: A newer Portuguese-only article is published
- **WHEN** a Portuguese-only article has a later date than every English article
- **THEN** the home-page feature stays on the latest available English article

#### Scenario: No English version is public
- **WHEN** no article has a public English version
- **THEN** the home page does not substitute Portuguese prose into the English feature

### Requirement: Individual blog post
The site SHALL statically provide each eligible English article at `/blog/<slug>/` and each eligible Portuguese article at `/pt/blog/<slug>/`, using that version's title, summary, first-publication date, optional modification date, Markdown body, media and author attribution. No unavailable language version SHALL yield a public article page. Article content SHALL remain free from scroll-reveal effects and SHALL NOT execute author-supplied HTML or MDX.

#### Scenario: Visitor opens the placeholder post
- **WHEN** a visitor follows the existing placeholder article link from `/blog/`
- **THEN** the linked English article displays a single primary heading, readable content sections and metadata matching its index preview

#### Scenario: Visitor opens a public article
- **WHEN** a visitor follows an index or home-page link to a public article
- **THEN** the article displays a single primary heading, readable body and metadata matching its card and language

#### Scenario: Visitor requests an unavailable version
- **WHEN** a visitor requests a draft, withdrawn or never-published language route
- **THEN** the public host returns HTTP 404 and does not expose its body through search, sitemap or page payloads

#### Scenario: Article contains an animated image
- **WHEN** the published Markdown references a validated GIF
- **THEN** the article presents it with intrinsic layout dimensions and an accessible way to stop the animation
