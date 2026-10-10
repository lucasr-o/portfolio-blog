# Site Quality Specification

## Purpose

Defines the shared navigation, responsive behavior, accessibility, visual system, discoverability, and delivery quality expected across every public page.

## Requirements

### Requirement: Shared top bar
Every public page SHALL display a compact top bar containing the choices `Work / Blog / About` and a visually separated `Contact` action while preserving meaningful link names for assistive technology.

#### Scenario: Visitor uses the top bar on a wide viewport
- **WHEN** a visitor views any public page on a wide viewport
- **THEN** Work, Blog, and About appear as one navigation group and Contact appears as the separated final action

#### Scenario: Visitor uses the top bar on a narrow viewport
- **WHEN** the available width cannot contain the wide layout
- **THEN** all four choices remain visible or are available through a keyboard-operable disclosure without overlapping or leaving the viewport

### Requirement: Responsive content
Every public page SHALL preserve readable content and reachable controls at widths down to 320 CSS pixels and at 200 percent browser zoom without page-level horizontal scrolling.

#### Scenario: Visitor uses a narrow viewport
- **WHEN** a public page is rendered at 320 CSS pixels wide
- **THEN** text, terminal content, navigation, and controls reflow without clipping, overlap, or unreachable content

#### Scenario: Visitor zooms the page
- **WHEN** a visitor zooms a public page to 200 percent
- **THEN** reading order and operability are preserved without content loss

### Requirement: Keyboard and semantic accessibility
Public pages SHALL use semantic landmarks and native interactive elements, provide a logical heading hierarchy, remain fully keyboard operable, and expose a visible focus indicator on every keyboard-reachable control.

#### Scenario: Visitor navigates by keyboard
- **WHEN** a visitor traverses a public page without a pointing device
- **THEN** every interactive element is reachable in a logical order and visibly indicates focus

#### Scenario: Visitor skips repeated navigation
- **WHEN** a keyboard user enters a public page
- **THEN** a skip link allows focus to move directly to the main content

### Requirement: Accessible color system
The site SHALL use a restrained neutral palette with the tertiary design color for any blue accent, SHALL meet WCAG AA contrast for text and interactive components, and SHALL not communicate state or meaning through color alone.

#### Scenario: Interface colors are verified
- **WHEN** foreground, background, border, and focus colors are evaluated
- **THEN** normal text reaches at least 4.5:1 contrast, large text reaches at least 3:1, and interactive component boundaries and focus indicators reach at least 3:1 against adjacent colors

#### Scenario: Blue is used as an accent
- **WHEN** the design requires a blue link, focus, or terminal accent
- **THEN** the value comes from the tertiary color token and retains a non-color cue where it conveys meaning or state

### Requirement: Motion preference
Non-essential animation, including animated editorial media, SHALL stop or resolve to an equivalent static state when the visitor requests reduced motion. An animated article image SHALL have a non-animated fallback and a keyboard-operable, clearly named control to pause or resume it without losing surrounding content.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** animated reveals, smooth scrolling, cursor blinking, and editorial GIF playback are disabled by default while all content and state remain understandable

#### Scenario: Reader pauses a GIF
- **WHEN** a reader activates the pause control on an animated article image
- **THEN** the image becomes static without layout shift and the control exposes the action to resume

### Requirement: Search metadata
Each public route SHALL provide a unique title, description, canonical URL, and social sharing metadata appropriate to its content, using `https://lucas-reis.com` as canonical origin. Localized blog routes SHALL declare their language and localized metadata; public article counterparts SHALL have reciprocal language alternates. Existing numbered archive pages SHALL be self-canonical and listed in the sitemap, while query-based search views SHALL not be separate sitemap entries and SHALL retain the first index page as canonical. The sitemap SHALL contain only public versions; drafts, unapproved versions, and administrative routes SHALL NOT appear in public discovery metadata.

#### Scenario: Search crawler requests a route
- **WHEN** a crawler requests `/`, a blog index, an existing numbered archive, or a public article
- **THEN** initial HTML contains primary content and route-specific metadata without client script execution, with canonical and social URLs on `lucas-reis.com`

#### Scenario: Numbered and queried archive is inspected
- **WHEN** a second archive page exists and a visitor opens it or uses a `q` parameter
- **THEN** the numbered page has its own canonical and sitemap entry, while the query view creates no separate discovery route

#### Scenario: Localized article is inspected
- **WHEN** both versions of an article are public
- **THEN** each page declares its own language, localized title and summary, and reciprocal language alternate without canonicalizing one language to the other

#### Scenario: Only one language exists
- **WHEN** an article has no public counterpart
- **THEN** its metadata and sitemap do not claim that counterpart

#### Scenario: Structured data is inspected
- **WHEN** structured data on the home page and either article locale is parsed
- **THEN** it describes Lucas Reis as a Person and the displayed article as a BlogPosting with matching author, localized title, language, dates, and canonical origin

#### Scenario: Editorial states differ
- **WHEN** the repository contains public and draft articles plus unfinished translations
- **THEN** the sitemap and discoverable article metadata contain only public article versions

#### Scenario: Administrative preview is inspected
- **WHEN** an authorized author opens protected preview in either language
- **THEN** it requests no indexing and is absent from the public sitemap and canonical routes

### Requirement: Performance-conscious delivery
The site SHALL statically deliver primary content, reserve layout space for media, avoid unnecessary third-party client scripts, and defer non-critical work. Full-text search data SHALL not be required for ordinary archive browsing and SHALL load only when search is used. Animated editorial media SHALL be bounded, not eagerly load below the fold, and not force animation downloads for a reader requesting reduced motion when a still alternative exists.

#### Scenario: Production build is evaluated
- **WHEN** each public route is evaluated under a consistent mobile Lighthouse profile
- **THEN** it scores at least 90 in Performance, Accessibility, Best Practices, and SEO with no layout shift caused by unreserved page media

#### Scenario: Reader browses without searching
- **WHEN** a visitor opens an archive page without submitting a query
- **THEN** initial HTML contains the public previews and the full-text search artifact is not downloaded

#### Scenario: Reader opens an article with a GIF below the fold
- **WHEN** the article initially loads before the GIF enters view
- **THEN** the image has reserved dimensions and does not delay primary article content

### Requirement: Safe and accessible blog discovery controls
Search and pagination SHALL use keyboard-operable native controls, visible focus, clear accessible names, localized status and error text, and a layout usable at 320 CSS pixels and 200 percent zoom. Query and page parameters SHALL be bounded inert data: they SHALL NOT execute, become regular expressions or HTML, or construct arbitrary fetch or article URLs. Search artifacts SHALL contain only public versions.

#### Scenario: Malicious-looking query is opened
- **WHEN** a URL contains HTML, script-like text, encoded controls, oversized `q`, or malformed `page`
- **THEN** the query remains inert, no untrusted navigation occurs, and pagination remains valid

#### Scenario: Reader uses keyboard or a narrow viewport
- **WHEN** a visitor searches, clears, opens an article, or paginates by keyboard at 320 pixels or 200 percent zoom
- **THEN** controls retain accessible names and visible focus without clipping, and current page is identifiable without color alone

#### Scenario: Reduced motion is requested
- **WHEN** reduced-motion preference matches during search or pagination
- **THEN** state and results remain understandable without animation
