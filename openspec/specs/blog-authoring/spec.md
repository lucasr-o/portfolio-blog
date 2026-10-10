# Blog Authoring Specification

## Purpose

Defines browser-based Portuguese-first Markdown authoring, automatic publication dates, direct image insertion, and protected previews for the Git-backed blog.

## Requirements

### Requirement: Portuguese-first source authoring
The CMS SHALL present Portuguese title, summary, and raw Markdown before optional English fields. It SHALL allow a Portuguese-only draft or publication, preserve Markdown source and meaningful whitespace after save and reopen, and keep existing English-only records editable without loss.

#### Scenario: Author starts a Portuguese post
- **WHEN** Lucas saves a Portuguese post without English text
- **THEN** it reopens with the same Portuguese source and no English content is required

#### Scenario: Author edits a legacy English-only post
- **WHEN** Lucas opens a record created under the former schema
- **THEN** its English content and public slug remain intact while Portuguese can be added independently

### Requirement: Automatic editorial timestamps and publication validation
The system SHALL derive creation from the first successful production commit containing the article and a separate immutable first-publication instant for each language from its first complete, approved, globally Published production commit. It SHALL derive later public modification metadata separately and SHALL NOT require a manually entered date, time, or timezone. A publication request with incomplete required fields SHALL be rejected before save success is reported. Local drafts and failed saves SHALL NOT establish dates; missing trustworthy history for new public content SHALL fail closed. Reviewed legacy dates MAY remain as migration pins.

#### Scenario: Portuguese is published first
- **WHEN** a complete Portuguese post first becomes public without English
- **THEN** that successful production commit establishes only its Portuguese publication instant

#### Scenario: English is added later
- **WHEN** English becomes public after Portuguese
- **THEN** that later commit establishes its English date without changing the Portuguese date

#### Scenario: Save fails before the production commit
- **WHEN** a save fails or remains only a local draft
- **THEN** it establishes no creation or publication instant

#### Scenario: Incomplete publication is attempted
- **WHEN** a publication request lacks title, summary, body, or a required image description
- **THEN** the editor identifies the missing field and does not report a successful published save

### Requirement: Direct media insertion into raw Markdown
The CMS SHALL accept a supported image pasted into or dropped onto the active Markdown editor, persist it with the article, and insert its safe local Markdown reference at the cursor in the same save. It SHALL provide a file-picker fallback, let the same asset be referenced from both languages with language-specific alternative text, and give an actionable error without a broken reference if insertion or persistence fails.

#### Scenario: Author pastes an image into Portuguese Markdown
- **WHEN** clipboard image bytes are pasted at a cursor position
- **THEN** the asset enters the article media inventory and a Markdown reference is inserted there for the same save

#### Scenario: Author reuses the image in English
- **WHEN** a saved image reference is reused in English Markdown with English alternative text
- **THEN** the English article resolves the same asset without a second upload

#### Scenario: Clipboard lacks an image file
- **WHEN** the clipboard contains ordinary text, a remote URL, or HTML without image bytes
- **THEN** the editor does not silently fetch external media or create a broken local image reference

#### Scenario: Save of pasted media fails
- **WHEN** image and Markdown cannot be persisted together
- **THEN** the editor retains unsaved content for retry and does not claim publication

### Requirement: Safe animated article media
The CMS SHALL accept genuine GIF files for article-body media within bounded file size, dimensions, frame count, and decoded pixels, alongside PNG, JPEG, and WebP. Covers SHALL remain still images. Bytes, extension, and references SHALL be validated before preview or release; unsupported or malformed files SHALL be rejected rather than served as executable content.

#### Scenario: Author adds a short GIF
- **WHEN** a valid GIF is pasted or selected and referenced in Markdown
- **THEN** protected preview and the published article resolve it from local editorial media

#### Scenario: Invalid GIF is supplied
- **WHEN** GIF bytes are malformed, mismatched, oversized, or exceed animation limits
- **THEN** validation rejects them with an actionable message

#### Scenario: GIF is chosen as cover
- **WHEN** an animated GIF is selected as cover
- **THEN** the editor rejects it and requests a still image

### Requirement: Protected saved preview of independent versions
The administrative preview SHALL show each saved language version, including incomplete drafts, from one saved repository revision with its media and publication-readiness feedback. It SHALL remain protected and non-indexable and distinguish a successful save from public deployment.

#### Scenario: Author previews a Portuguese-only draft
- **WHEN** Lucas saves Portuguese content without English and opens preview
- **THEN** Portuguese content and media render while English is identified as unpublished
