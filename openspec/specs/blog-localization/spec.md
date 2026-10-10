# Blog Localization Specification

## Purpose

Defines independent Portuguese and English publication for a shared blog article, with stable URLs, localized discovery, and a protected preview for work in progress.

## Requirements

### Requirement: Optional Portuguese source authoring
The browser editor SHALL let the owner save Portuguese title, summary, and raw Markdown in the same article record as any English version, preserving meaningful whitespace. It SHALL allow Portuguese to be written and saved first without requiring English.

#### Scenario: Owner starts in Portuguese
- **WHEN** the owner saves a Portuguese draft with no English text
- **THEN** the Portuguese source reopens intact and no English publication is required

#### Scenario: Owner reopens translated Markdown
- **WHEN** the owner saves Markdown containing headings, tables, and fenced code, then reopens the record
- **THEN** its source syntax and meaningful whitespace remain editable

### Requirement: Explicit Portuguese publication readiness
Each language version SHALL require explicit approval and complete valid title, summary, body, and referenced media before becoming public. An incomplete or unapproved version SHALL not have a public route, preview card, discovery entry, or media exported solely for that version. Invalid approved content SHALL block release with field-specific feedback and SHALL NOT silently fall back to the other language.

#### Scenario: Portuguese is published before English
- **WHEN** a valid Portuguese version is approved while English is absent or incomplete
- **THEN** the Portuguese article is published and the English article route is not

#### Scenario: Owner approves a complete translation
- **WHEN** an existing article gains a complete, approved second-language version
- **THEN** the next successful release publishes both versions under the same slug

#### Scenario: Owner approves an incomplete version
- **WHEN** the owner approves a version missing a required localized field
- **THEN** validation identifies that field and does not publish a partial page

#### Scenario: Owner withdraws one version
- **WHEN** the owner removes approval from one language and a new release completes
- **THEN** that language's route and discovery entries are removed while the other language remains public

### Requirement: Protected translation preview
The administrative preview SHALL show each language's latest saved title, summary, Markdown, and referenced media, including incomplete drafts. It SHALL identify unpublished content, remain protected and non-indexable, and SHALL NOT claim that unsaved media is live.

#### Scenario: Owner checks an unfinished translation
- **WHEN** the owner saves a partial language version and opens its protected preview
- **THEN** the saved content and publication issues appear without a public route or search entry

### Requirement: Independently publishable language versions
An article SHALL have one shared identity and slug but independently publishable Portuguese and English versions. A complete Portuguese version SHALL be publishable without English; an English version MAY be added later. Neither language SHALL display unavailable text from the other as a fallback.

#### Scenario: Portuguese-only article becomes public
- **WHEN** a valid Portuguese version is approved and English is absent or incomplete
- **THEN** `/pt/blog/<slug>/` is published while `/blog/<slug>/` is not

#### Scenario: English translation is published later
- **WHEN** the owner completes and approves English for an existing Portuguese article
- **THEN** its English route and discovery entries appear without changing the Portuguese URL or body

#### Scenario: One version is withdrawn
- **WHEN** English is withdrawn but Portuguese remains approved
- **THEN** the English route disappears while Portuguese remains public

### Requirement: Locale-specific first-publication dates
Each public language version SHALL display and be ordered by its own immutable first-publication instant from its first qualifying production commit or a reviewed legacy date pin. Draft creation, edits, withdrawal, and republication SHALL NOT silently reset it. Later edits MAY expose a separate modification time.

#### Scenario: Translation appears weeks later
- **WHEN** Portuguese is published first and English two weeks later
- **THEN** English uses its later date while Portuguese retains its original date and order

#### Scenario: Published version is edited
- **WHEN** the body of a public version changes
- **THEN** its first-publication date stays stable and modification metadata reflects the edit

### Requirement: Locale-correct discovery and switching
Each blog index and search SHALL include only public versions in its own language. Article switches, canonical and alternate metadata SHALL refer only to public counterparts using the same slug.

#### Scenario: Visitor opens a single-language article
- **WHEN** a reader opens a Portuguese-only article
- **THEN** it has no broken English counterpart link or English article metadata

#### Scenario: Both versions are public
- **WHEN** a reader opens either version of a bilingual article
- **THEN** the switch links to the same article in the other language and each page retains its own localized content and date
