# Spec Delta

## Purpose

Allow the owner to add a Portuguese Markdown translation to an existing English post when ready, without delaying or exposing unfinished work in the public blog.

## ADDED Requirements

### Requirement: Optional Portuguese source authoring
The browser-based editor SHALL let the owner save Portuguese title, summary and raw Markdown body in the same article record as its English version. It SHALL preserve Markdown source and meaningful whitespace, and SHALL permit a partial Portuguese translation to be saved without preventing an otherwise valid English article from publishing.

#### Scenario: Owner starts translating a published English article
- **WHEN** the owner saves only a Portuguese title and part of its Markdown body without approving the translation
- **THEN** those edits remain available in the protected editor and saved preview, while the existing English public article remains unchanged

#### Scenario: Owner reopens translated Markdown
- **WHEN** the owner saves Portuguese Markdown containing headings, tables and fenced code, then reopens the record
- **THEN** the source text remains editable with its syntax and meaningful whitespace preserved

### Requirement: Explicit Portuguese publication readiness
An article SHALL have an explicit editorial control for making its Portuguese version public. The Portuguese version SHALL become eligible only when the English parent article is eligible at the release publication instant, the Portuguese version is approved, and its title, summary and body are complete and valid. An incomplete or unapproved version SHALL not have a public article route, preview card, discovery entry or public media solely referenced by that version. Invalid approved Portuguese content SHALL block a successful release with field-specific feedback; it SHALL not silently fall back to English text.

#### Scenario: English is published before translation
- **WHEN** a valid English article is published and its Portuguese version is absent, partial or unapproved
- **THEN** the English article remains public and the Portuguese article route is not published

#### Scenario: Owner approves a complete translation
- **WHEN** an eligible English article has a complete Portuguese title, summary and body and the owner approves that version
- **THEN** the next successful release publishes both language versions of that same article

#### Scenario: Owner approves an incomplete translation
- **WHEN** the owner approves a Portuguese version that lacks a required localized field
- **THEN** the release reports the affected field and does not publish a partially translated page

#### Scenario: Owner withdraws the translation
- **WHEN** the owner removes Portuguese approval and a new release completes
- **THEN** the Portuguese article URL returns HTTP 404 and its old public output and discovery metadata are removed, while the English article remains public

### Requirement: Protected translation preview
The administrative preview SHALL display the latest saved Portuguese title, summary, Markdown and referenced media even before Portuguese publication, identify that the version is not yet public, and retain the existing protection and no-index behavior for drafts.

#### Scenario: Owner checks an unfinished translation
- **WHEN** the owner saves a partial Portuguese translation and opens its protected saved preview
- **THEN** the preview shows the saved Portuguese content and missing-publication issues without adding a public route or search entry
