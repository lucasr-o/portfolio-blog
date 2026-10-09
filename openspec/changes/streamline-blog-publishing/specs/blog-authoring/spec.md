# Spec Delta

## Purpose

Defines a browser authoring flow that keeps Markdown source editable, makes Portuguese the first writing language, and persists validated editorial media without manual path handling.

## ADDED Requirements

### Requirement: Portuguese-first source authoring
The CMS SHALL present Portuguese title, summary and raw Markdown before optional English fields for new and existing posts. It SHALL allow a Portuguese-only draft or publication without English text, preserve source Markdown and meaningful whitespace after save/reopen, and keep existing English-only records editable without loss.

#### Scenario: Author starts a Portuguese post
- **WHEN** Lucas creates a post, writes Portuguese Markdown and saves it without English text
- **THEN** the saved draft reopens with the same Portuguese source and no English content is required

#### Scenario: Author edits a legacy English-only post
- **WHEN** Lucas opens a post created under the previous English-first schema
- **THEN** its English content and public slug remain intact while Portuguese fields can be added independently

### Requirement: Automatic editorial timestamps and publication validation
The system SHALL derive an immutable creation instant from the first successful production-branch commit containing the article and a separate immutable first-publication instant for each language from its first complete, approved, globally Published production-branch commit. It SHALL derive later public modification metadata separately, SHALL NOT require Lucas to type a date, time or timezone, and SHALL reject a publication request with incomplete required fields before reporting save success. Local drafts or failed saves SHALL NOT establish a date; missing trustworthy history for a newly public language SHALL fail closed before release. Reviewed dates from already-public legacy records MAY remain as migration pins.

#### Scenario: Portuguese is published first
- **WHEN** a complete Portuguese post is first published without English
- **THEN** the successful production commit establishes its Portuguese publication instant and no English publication instant is created

#### Scenario: English is added later
- **WHEN** the English version is first published after the Portuguese version
- **THEN** that later successful production commit establishes the English publication instant while the Portuguese date remains unchanged

#### Scenario: Save fails before the production commit
- **WHEN** Lucas attempts to publish a complete article but the GitHub save fails or remains only a local draft
- **THEN** no creation or publication instant is established for that attempt

#### Scenario: Incomplete publication is attempted
- **WHEN** Lucas requests publication with a missing title, summary, Markdown body or required image description
- **THEN** the editor identifies the missing field and does not report a successful published save

### Requirement: Direct media insertion into raw Markdown
The CMS SHALL accept a supported image file pasted into or dropped onto the active Markdown editor, persist it with the article, and insert its safe local Markdown reference at the cursor without requiring a save-preview-copy round trip. It SHALL also retain a file picker fallback, allow the same saved asset to be referenced in both languages with language-specific alternative text, and provide an actionable error without a broken reference when insertion or persistence fails.

#### Scenario: Author pastes an image into Portuguese Markdown
- **WHEN** the clipboard supplies a supported image file and Lucas pastes it at a cursor position
- **THEN** the editor adds the image to that article's media inventory and inserts a Markdown image reference at that position for the same save

#### Scenario: Author reuses the image in English
- **WHEN** Lucas copies a saved image reference into English Markdown and writes English alternative text
- **THEN** the public English article resolves the same asset without a second upload

#### Scenario: Clipboard lacks an image file
- **WHEN** Lucas pastes text, a remote image URL or HTML without image bytes
- **THEN** the editor does not silently fetch external media or create a broken local image reference

#### Scenario: Save of pasted media fails
- **WHEN** the CMS cannot persist the image and Markdown together
- **THEN** it reports the failure and keeps the unsaved editor content available for retry without claiming publication

### Requirement: Safe animated article media
The CMS SHALL accept genuine GIF files for article-body media subject to bounded file size and decoded dimensions, while continuing to accept PNG, JPEG and WebP. The article cover SHALL remain a still image. Uploaded bytes, extension and media references SHALL be validated before protected preview or public release, and an unsupported or malformed file SHALL be rejected rather than served as executable content.

#### Scenario: Author adds a short GIF
- **WHEN** Lucas pastes or selects a valid GIF within the configured limits and uses its reference in Markdown
- **THEN** the protected preview and published article resolve that GIF from the local editorial media collection

#### Scenario: Invalid GIF is supplied
- **WHEN** a file is malformed, oversized, mismatched to its extension or exceeds animation limits
- **THEN** the CMS or release validation rejects it with an actionable message

#### Scenario: GIF is chosen as cover
- **WHEN** Lucas tries to use an animated GIF in the cover field
- **THEN** the editor rejects it and requests a still cover image

### Requirement: Protected saved preview of independent versions
The administrative preview SHALL show each saved language version, including incomplete drafts, from one saved repository revision with its media and publication-readiness feedback. The preview SHALL remain protected and non-indexable, and SHALL distinguish a successful save from public deployment.

#### Scenario: Author previews a Portuguese-only draft
- **WHEN** Lucas saves Portuguese content with no English version and opens the preview
- **THEN** the Portuguese content and media render while the English view indicates that it is not published
