# Tasks

## 1. Application foundation

- [x] 1.1 Scaffold a JavaScript Next.js App Router project with static output, lint, test, and production-build scripts, and verify dependency installation plus the empty production build succeed.
- [x] 1.2 Create the three route skeletons for `/`, `/blog`, and `/blog/[slug]`, generate the known placeholder slug statically, and verify the production export contains HTML for each route.
- [x] 1.3 Add the shared root layout, skip link, header, navigation, footer, and route-aware anchor destinations, and verify component tests cover every `Work / Blog / About` and separated `Contact` target from home and blog routes.
- [x] 1.4 Add global design tokens and CSS Module conventions for the neutral palette, tertiary accent, system type stacks, spacing, containers, focus styles, and reduced motion, and verify automated contrast checks pass for text, controls, and focus pairs.
- [x] 1.5 Document local development, test, static-build, and export commands in the project README, and verify each documented command runs as written.

## 2. Portfolio home experience

- [x] 2.1 Create centralized JavaScript records seeded from the supplied resume for Lucas Reis de Oliveira da Silva's profile, five experience entries, objective, two education entries, credentials, authorized telephone, email, LinkedIn, and terminal steps; verify data tests cover required display fields, normalized contact links, dates, and reserved terminal targets.
- [x] 2.2 Implement the home hero for Lucas Reis de Oliveira da Silva as an Application Security Engineer with Work and Blog calls to action, and verify the rendered page exposes one `h1`, the professional specialization, and correct CTA destinations.
- [x] 2.3 Implement the Work, About, Academic Background, Credentials, and Contact sections from the centralized resume records using semantic lists, sections, headings, and direct links, and verify component tests cover all supplied roles and institutions, section IDs, heading order, and operable telephone, email, and LinkedIn destinations.
- [x] 2.4 Implement the minimal terminal visual with the planned `nmap`, `sqlmap`, and source-scanner transcript, reserved `.test` targets, one-shot viewport-triggered sequencing, and a complete no-JavaScript fallback; verify tests cover sequence completion, observer failure, and the non-interactive behavior.
- [x] 2.5 Add the terminal's accessible description and reduced-motion behavior so incremental characters are not announced and the completed transcript appears immediately, and verify both assistive-technology markup and `prefers-reduced-motion: reduce` states in component tests.
- [x] 2.6 Apply responsive home layouts for the hero, terminal, work timeline or cards, latest-writing feature, education and credentials lists, and contact block, and verify browser tests at 320 pixels and 200 percent zoom show no overlap, clipping, page-level horizontal scroll, or unreachable content.
- [x] 2.7 Document how to revise the resume-derived profile, experience, education, credentials, authorized contact, and terminal content, and verify the documented content module paths match the implementation.

## 3. Blog experience

- [x] 3.1 Define the local placeholder post record with slug, title, summary, author, ISO publication date, reading time, tags, and structured body sections; derive the latest post from the date-sorted collection and verify data tests keep the latest selection, index preview, and article metadata consistent.
- [x] 3.2 Implement the home-page Latest Writing feature and `/blog` editorial index from the shared latest-post selection, giving the newest post featured treatment and a working article link; verify route tests find matching title, summary, publication date, reading time, and URL on both pages.
- [x] 3.3 Implement the statically generated placeholder article with a narrow prose measure, semantic article structure, author and publication metadata, and a visible back-to-blog link, and verify route tests cover its heading hierarchy, metadata, body sections, and return path.
- [x] 3.4 Apply shared and responsive blog styling, and verify browser tests confirm readable line length, visible focus, and complete content access at desktop, 320 pixels, and 200 percent zoom.
- [x] 3.5 Document the local post record format and the steps to add another static article, and verify a fixture post can be added and built using those instructions.

## 4. Discoverability and delivery quality

- [x] 4.1 Add shared site identity and route-specific titles, descriptions, canonical URLs, and Open Graph metadata generated from visible content records, and verify exported HTML for all three routes contains unique, matching metadata.
- [x] 4.2 Add Person JSON-LD on the home page and BlogPosting JSON-LD on the article page, and verify structured-data tests parse the output and match the visible identity, URL, title, author, and publication values.
- [x] 4.3 Generate sitemap and robots directives for the three public routes, and verify the production export contains valid files referencing the canonical `lucas-reis.dev` URLs.
- [x] 4.4 Audit client boundaries and assets so only the terminal ships interactive JavaScript, layout dimensions remain reserved, and no unnecessary third-party scripts or animation packages are included; verify the production bundle report and layout-shift browser assertion meet these constraints.
- [x] 4.5 Add route-level accessibility assertions for landmarks, one `h1`, link names, keyboard reachability, focus visibility, reduced motion, and non-color cues, and verify the automated accessibility suite reports no serious or critical violations.

## 5. Integrated release verification

- [x] 5.1 Run end-to-end navigation through home anchors, the home latest-post feature, blog index, placeholder post, back-to-blog, and blog-to-home section links using both pointer and keyboard, and verify every transition reaches the expected route or focused section.
- [x] 5.2 Run the full lint, unit, component, browser, accessibility, and production-build suite from a clean checkout, and verify all commands exit successfully with the static artifact containing only the planned public routes.
- [x] 5.3 Run Lighthouse against the production build for `/`, `/blog`, and the placeholder post under one documented mobile profile, and verify each route scores at least 90 for Performance, Accessibility, Best Practices, and SEO.
