# Blog Experience Specification

## Purpose

Defines a focused writing experience where visitors can discover Lucas Reis's application-security articles and read a complete, well-structured individual post.

## Requirements

### Requirement: Blog index
The site SHALL provide a blog index at `/blog` that introduces the writing area, orders available posts by publication date descending, and lists each post with title, summary, publication date, and reading time.

#### Scenario: Visitor opens the blog index
- **WHEN** a visitor opens `/blog`
- **THEN** the page displays its own primary heading and at least one placeholder post preview with a working link to the post

#### Scenario: Visitor sees the newest post first
- **WHEN** the blog index contains one or more posts
- **THEN** the post with the newest publication date receives the featured treatment before any older post previews

### Requirement: Latest post feature on the home page
The home page SHALL contain a `Latest Writing` feature derived from the newest blog post record and linking to that article.

#### Scenario: Visitor reviews the latest writing feature
- **WHEN** a visitor reaches the Latest Writing section on `/`
- **THEN** it displays the newest post's title, summary, publication date, reading time, and a working link to the article

#### Scenario: Blog content changes
- **WHEN** a post with a newer publication date is added to the local content collection
- **THEN** the home-page feature and the featured blog-index entry both resolve to that newer post without separate duplicated content

### Requirement: Individual blog post
The site SHALL initially provide one statically available placeholder article at `/blog/<slug>` with a title, publication metadata, introductory summary, structured body content, and author attribution.

#### Scenario: Visitor opens the placeholder post
- **WHEN** a visitor follows the placeholder post link from `/blog`
- **THEN** the linked article displays a single primary heading, readable content sections, and metadata matching its index preview

### Requirement: Blog navigation continuity
The blog index and individual post SHALL preserve the shared top navigation and provide a clear route back to the blog index.

#### Scenario: Reader returns to the index
- **WHEN** a reader activates the back-to-blog link from the article
- **THEN** the reader is navigated to `/blog`

#### Scenario: Reader chooses a portfolio section from a blog page
- **WHEN** a reader activates Work, About, or Contact from a blog route
- **THEN** the reader is navigated to the corresponding anchored section on `/`
