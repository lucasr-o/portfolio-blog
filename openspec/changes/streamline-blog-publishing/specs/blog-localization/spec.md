# Spec Delta

## Purpose

Defines independent Portuguese and English availability for one blog article while preserving stable URLs, shared identity, accessible language switching and accurate locale-specific publication metadata.

## ADDED Requirements

### Requirement: Independently publishable language versions
An article SHALL have one shared identity and slug but independently publishable Portuguese and English versions. A complete Portuguese version SHALL be publishable without English; an English version MAY be added later. Incomplete or unapproved versions SHALL have no public article route, card, search entry, sitemap entry or media exported solely for that version, and SHALL NOT fall back to text from the other language.

#### Scenario: Portuguese-only article becomes public
- **WHEN** a valid Portuguese version is approved for publication and English is absent or incomplete
- **THEN** `/pt/blog/<slug>/` is published while `/blog/<slug>/` is not, and the English index has no misleading card for it

#### Scenario: English translation is published later
- **WHEN** Lucas completes and approves English for an already published Portuguese article
- **THEN** the English article route, index/search entry and language-switch link become available without changing the Portuguese URL or body

#### Scenario: One version is withdrawn
- **WHEN** Lucas withdraws the English version but leaves Portuguese published
- **THEN** the English route and discovery entries disappear while the Portuguese route remains public

### Requirement: Locale-specific first-publication dates
Each public language version SHALL display and be ordered by its own immutable first-publication instant from the first qualifying production commit or a reviewed legacy date pin, not by the draft creation time or the other language's first-publication instant. Editing or withdrawing and later republishing a version SHALL NOT silently reset that date; later edits MAY expose a separate modification time.

#### Scenario: Translation appears weeks later
- **WHEN** Portuguese is published first and English is first published two weeks later
- **THEN** the English card and article use the later English date and may become the latest English post, while the Portuguese date and ordering remain unchanged

#### Scenario: Published version is edited
- **WHEN** Lucas updates the body of an already published language version
- **THEN** its first-publication date remains stable and its modification metadata reflects the update

### Requirement: Locale-correct discovery and switching
The English index and search SHALL contain only published English versions; the Portuguese index and search SHALL contain only published Portuguese versions. Article language switches, canonical and alternate metadata SHALL refer only to public counterparts, and the same slug SHALL be used under both existing locale URL patterns.

#### Scenario: Visitor opens a single-language article
- **WHEN** a reader opens an article published only in Portuguese
- **THEN** the article does not offer a broken English counterpart link or claim one in search metadata

#### Scenario: Both versions are public
- **WHEN** a reader opens either version of a bilingual article
- **THEN** the language switch links to the same article in the other language and each version retains its own title, summary, body and publication date
