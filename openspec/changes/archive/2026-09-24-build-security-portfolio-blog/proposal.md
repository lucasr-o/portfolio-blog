# Proposal

## Why

Lucas Reis needs a focused professional presence that communicates his work as an Application Security Engineer while giving his technical writing a first-class, discoverable home. The site should translate the supplied editorial reference into a distinctive security-oriented experience without sacrificing clarity, accessibility, search visibility, or performance.

## What Changes

- Create a three-page React and JavaScript website for `lucas-reis.dev`: a portfolio home page, a blog index, and an individual placeholder blog post.
- Build a compact top bar with `Work / Blog / About` as the primary choices and `Contact` as a separated action; on the home page, section links navigate to page anchors while Blog navigates to `/blog`.
- Present Lucas Reis as an Application Security Engineer through a concise hero and a minimal animated terminal using safe, fictional-target security commands such as `nmap`, `sqlmap`, and an application-security scanner.
- Seed the home page with the supplied resume content: professional experience, research and community leadership, academic background, certifications, location, telephone, email, and LinkedIn profile; this content remains editable but is not generic placeholder copy.
- Add Work, About, Academic Background, Credentials, and Contact sections to the home page.
- Add a blog index and a readable placeholder post page with consistent navigation and metadata, and feature the most recent post on both the home page and the blog index.
- Establish a responsive monochrome visual system inspired by the supplied reference, using the tertiary color for blue accents when needed and preserving strong contrast.
- Statically generate public content and add semantic structure, route-specific metadata, social previews, structured data, sitemap, and robots directives for SEO.
- Respect reduced-motion preferences, keyboard navigation, visible focus, narrow viewports, and content access without relying on animation or color alone.

## Capabilities

### New Capabilities

- `security-portfolio`: Covers the home-page navigation, Application Security Engineer hero, animated security terminal, resume-derived Work, About, Academic Background, Credentials, and Contact sections.
- `blog-experience`: Covers the latest-post feature, blog index, and individual placeholder article route, including readable content structure and navigation between the blog surfaces.
- `site-quality`: Covers shared responsive behavior, accessible interaction and motion, visual contrast, SEO metadata, static delivery, and performance expectations across all pages.

### Modified Capabilities

None.

## Impact

- Introduces a new React and JavaScript frontend and its routing, styling, content, animation, metadata, and test infrastructure.
- Adds three public routes: `/`, `/blog`, and one statically generated placeholder post under `/blog/<slug>`.
- Introduces only static content; personal portfolio content is seeded from the supplied resume, while the single blog article remains placeholder content.
- Publishes the supplied telephone, email address, location, and LinkedIn URL in the static Contact section as authorized provisional content.
- No database, authentication, content management system, analytics service, or contact-form backend is included.
- Uses fictional or reserved targets in terminal copy so the presentation does not instruct visitors to scan real systems.
