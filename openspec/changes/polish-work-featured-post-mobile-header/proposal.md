# Proposal

## Why

The public portfolio is readable and recognizable, but the Work logos carry inconsistent visual weight, the dark home-page article preview competes with the terminal, and the mobile header feels split across two unrelated rows. These are focused presentation issues that can be improved without changing the site's content or navigation destinations.

## What Changes

- Give Work organization logos consistent white frames, optical size, and alignment while retaining the current approved image assets and accessible organization names.
- Make the home-page latest-post preview more compact and visually quieter so the terminal remains the main visual accent; retain the latest English post, its metadata, and its article link.
- Compose the mobile header intentionally: brand and Contact on the first row, Work / Blog / About as a clearly grouped second row, with reachable controls at narrow widths and zoom.
- Validate the three adjustments on desktop and mobile before publishing through the existing production workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `security-portfolio`: Work logos have consistent presentation without obscuring experience details.
- `blog-experience`: The latest English post on the home page remains complete and navigable in a compact editorial treatment.
- `site-quality`: The narrow-screen shared header has a deliberate two-row arrangement while retaining all top-bar actions and accessibility.

## Impact

Presentation code and tests for the Work list, home-page post preview, and shared header are affected. No CMS schema, blog content, routes, APIs, image assets, or deployment architecture change. Production release uses the existing GitHub-to-S3/CloudFront flow.
