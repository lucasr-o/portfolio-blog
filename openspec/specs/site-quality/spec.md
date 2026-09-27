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
Non-essential animation SHALL stop or resolve to an equivalent static state when the visitor requests reduced motion.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** animated reveals, smooth scrolling, and cursor blinking are disabled while all content and state remain understandable

### Requirement: Search metadata
Each public route SHALL provide a unique title, description, canonical URL, and social sharing metadata appropriate to its content. The site SHALL also expose crawl directives, a sitemap, and structured data for the person and blog article where applicable.

#### Scenario: Search crawler requests a route
- **WHEN** a crawler requests `/`, `/blog`, or the placeholder post URL
- **THEN** the initial HTML contains the route's primary content and route-specific metadata without requiring client-side script execution

#### Scenario: Structured data is inspected
- **WHEN** structured data on the home page and article page is parsed
- **THEN** it describes Lucas Reis as a Person on the home page and the placeholder content as a BlogPosting on the article page

### Requirement: Performance-conscious delivery
The site SHALL statically deliver its primary content, reserve layout space for media, avoid unnecessary third-party client scripts, and defer non-critical work so the initial page remains fast and visually stable.

#### Scenario: Production build is evaluated
- **WHEN** each public route is evaluated under a consistent mobile Lighthouse profile
- **THEN** it scores at least 90 in Performance, Accessibility, Best Practices, and SEO with no layout shift caused by unreserved page media
