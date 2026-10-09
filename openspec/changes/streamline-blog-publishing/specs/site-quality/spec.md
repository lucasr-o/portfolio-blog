# Spec Delta

## MODIFIED Requirements

### Requirement: Motion preference
Non-essential animation, including animated editorial media, SHALL stop or resolve to an equivalent static state when the visitor requests reduced motion. An animated article image SHALL have a non-animated fallback and a keyboard-operable, clearly named control to pause or resume it without losing the surrounding article content.

#### Scenario: Reduced motion is enabled
- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** animated reveals, smooth scrolling, cursor blinking and editorial GIF playback are disabled by default while all content and state remain understandable

#### Scenario: Reader pauses a GIF
- **WHEN** a reader activates the pause control on an animated article image
- **THEN** the image becomes static without a layout shift and the control exposes the action to resume

### Requirement: Performance-conscious delivery
The site SHALL statically deliver its primary content, reserve layout space for media, avoid unnecessary third-party client scripts, and defer non-critical work so the initial page remains fast and visually stable. Animated editorial media SHALL be bounded and not eagerly load below the fold, and shall not force motion downloads for readers requesting reduced motion when a still alternative is available.

#### Scenario: Production build is evaluated
- **WHEN** each public route is evaluated under a consistent mobile Lighthouse profile
- **THEN** it scores at least 90 in Performance, Accessibility, Best Practices, and SEO with no layout shift caused by unreserved page media

#### Scenario: Reader opens an article with a GIF below the fold
- **WHEN** the article initially loads before the GIF is in view
- **THEN** the media has reserved dimensions and does not delay the primary article content
