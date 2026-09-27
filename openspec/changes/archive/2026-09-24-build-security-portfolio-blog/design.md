# Design

## Context

See `proposal.md` for motivation. The repository currently contains an initialized OpenSpec root but no application source, dependencies, design system, or existing public capabilities. The implementation therefore establishes a small greenfield frontend while remaining constrained to React with JavaScript, three public content routes, static content, and the visual composition of the supplied reference.

The site needs only one interactive flourish: a minimal terminal sequence. Everything else can be delivered as static content and native navigation. The supplied resume provides the provisional identity, experience, academic, credential, and contact content; only the initial blog article remains placeholder content. All values still live in centralized content objects so they can be corrected without editing layout components.

## Goals / Non-Goals

**Goals:**

- Produce crawlable static HTML for all three public routes while retaining React component composition.
- Keep the shared shell, typography, palette, spacing, and navigation consistent without introducing a heavyweight UI system.
- Isolate terminal animation so it cannot delay primary content, disturb assistive technology, or override reduced-motion preferences.
- Make resume-derived portfolio content and placeholder blog content straightforward to revise without editing layout components.
- Provide measurable checks for narrow widths, keyboard use, contrast, metadata, and production performance.

**Non-Goals:**

- A CMS, database, API, authentication flow, comments, search, pagination, analytics, or contact-form submission service.
- Interactive penetration-testing tools, execution of terminal commands, or scanning of any live target.
- A dark theme, elaborate dashboard aesthetic, animated page transitions, or continuous terminal loop.
- More than one placeholder article in the initial release.

## Decisions

### Use a statically generated React application

Use Next.js with the App Router in JavaScript and configure static output. Keep the shared shell in the root layout, implement `/`, `/blog`, and `/blog/[slug]`, and generate the single known article slug at build time. Only the terminal component needs a client boundary; page content and metadata remain statically rendered.

This approach preserves the requested React stack while giving every route initial HTML and route-level metadata without a runtime server. A client-only Vite SPA was rejected because it would require an additional prerendering solution to meet the SEO contract. A server deployment was rejected because the current scope has no dynamic data. Astro was considered but rejected to keep React, rather than an islands framework, as the application foundation.

### Keep content in local JavaScript data modules

Store profile, experience, education, credentials, contact, and post records in small local JavaScript modules. Components consume stable fields such as title, organization, summary, dates, outcomes, links, and body sections. The resume-derived personal content and placeholder article can then be corrected or replaced without restructuring the routes.

Markdown or a CMS would add parsing or runtime concerns that one placeholder post does not justify. The data shape should remain compatible with a future migration if article volume grows.

### Map the supplied resume into web-native content

Treat the LaTeX resume as a content source, not as a layout template. Normalize escaped characters and the malformed LinkedIn markup before storing values. Seed the initial records as follows:

- Identity: Lucas Reis de Oliveira da Silva, based in Santo André, SP.
- Public contact: display telephone `+55 (13) 99610-4000`, link it as `tel:+5513996104000`, display and link `lucasreis.dos@gmail.com`, and link `https://www.linkedin.com/in/lucas-reis-o`.
- Hero specialization: Application Security Engineer. Keep the current Mercado Livre title, Cybersecurity Engineer, inside the experience timeline rather than replacing the hero specialization.
- Professional objective: grow as a security engineer, deepen penetration-testing expertise, and progress toward leadership.
- Experience: Cybersecurity Engineer at Mercado Livre (Sep 2026-present); Application Security Engineer at PagBank (Oct 2024-Sep 2026); Cyber Security Trainee at Go Ahead IT (Nov 2023-Jul 2024); Scholarship Research at UFABC (Nov 2022-Nov 2023); and Information Security Coordinator at Green Team Hacker Club (Sep 2022-present). Preserve the supplied security-review, threat-modeling, vulnerability-management, pentesting, DevSecOps, SIEM, cryptography, teaching, team-management, and CTF highlights as concise bullets.
- Education: Bachelor of Computer Science at Federal University of ABC, expected 2026; Computer Networks Technician at SENAI-SP, 2019-2020.
- Credentials: ISC2 Certified in Cybersecurity (Mar 2023), the supplied Cisco certificate collection, and University of Cambridge B1 English certificate (Dec 2019).

Do not reproduce commented-out LaTeX, misspellings, formatting commands, or duplicated resume headings. Present Work as an outcome-led timeline or card list, place the professional objective in About, and place certificates in Credentials after Academic Background.

The authorized telephone and email are intentionally public in the static export. Keeping them in the centralized profile record makes later redaction a single-data change.

### Translate the reference through composition, not imitation

Retain the reference's compact header, centered large-type hero, generous whitespace, restrained neutral palette, paired calls to action, and large framed visual below the hero. Replace the product screenshot with a terminal and use original copy, content, proportions, and branding.

The wide header places the `lucas-reis` wordmark at the start, `Work / Blog / About` together as the principal navigation group, and `Contact` at the far end. Slash separators are presentational and hidden from assistive technology. On `/`, Work, About, and Contact target in-page sections. On blog routes they target `/#work`, `/#about`, and `/#contact`; Blog targets `/blog` everywhere.

On narrow screens the header first attempts a wrapped compact layout. If verified content cannot fit cleanly at 320 pixels, it uses a native button-controlled disclosure with an accessible name, expanded state, focus management, and no pointer-only behavior.

### Use a tokenized, dependency-light visual layer

Use global CSS custom properties for color, typography, spacing, borders, container width, and motion, with CSS Modules for component-local layout. Start with a warm-white surface, near-black text, muted neutral text, light neutral rules, and the project tertiary token as the only blue source. Use a system sans-serif stack to avoid a render-blocking font request; use a system monospace stack inside the terminal.

Type scales fluidly with bounded `clamp()` values. Content uses a shared max-width container, while article prose uses a narrower readable measure. Focus styling uses an explicit high-contrast outline and offset rather than color alone.

A utility-first framework or component library was rejected because this small, bespoke surface does not need its dependency or abstraction cost.

### Make the terminal a progressive visual enhancement

Server-render the completed transcript and a concise accessible description. The visual animation layer is ignored by assistive technology so character-by-character updates are never announced. After hydration, an `IntersectionObserver` starts a small state machine once: command typing, immediate short output, pause, next command, completed cursor.

Use an intentionally restrained sequence against the reserved `.test` namespace, for example:

```text
$ nmap -sV app.test
443/tcp open https

$ sqlmap -u "https://app.test/item?id=1" --batch
[INFO] no injectable parameters found

$ semgrep --config auto src/
scan complete: 0 blocking findings
```

The sequence is illustrative and never accepts input or runs commands. With reduced motion, without JavaScript, or after an observer failure, the completed transcript is visible immediately. No animation library is introduced.

### Model the three pages as distinct reading experiences

The home page follows this order: header, hero and calls to action, terminal, Work, Latest Writing, About, Academic Background, Credentials, Contact, footer. Work cards remain text-led and outcome-oriented; Academic Background and Credentials use semantic lists; Contact uses direct links rather than a non-functional form.

The blog index uses a compact editorial header and post list. Sort local posts by their ISO publication date in descending order, derive one `latestPost` value from that sorted collection, and reuse it for the home-page Latest Writing feature and the featured entry at the top of `/blog`. The article route prioritizes a narrow reading column, metadata, structured headings, and a visible return link. One local placeholder post demonstrates the final structure without implying a CMS.

### Build metadata from the same content records

Define a single site URL and shared identity data, then generate route titles, descriptions, canonical URLs, Open Graph data, and article structured data from the same records used for visible content. Generate `robots.txt` and `sitemap.xml` as part of the static build. The home page emits Person JSON-LD; the post emits BlogPosting JSON-LD.

This avoids metadata drift and keeps placeholder content internally consistent. Each page uses one visible `h1` and semantic header, navigation, main, section, article, and footer landmarks as appropriate.

### Verify behavior at the component, route, and production levels

Use linting and a lightweight test setup for navigation targets, route content, terminal reduced-motion state, and metadata records. Use browser-level checks for keyboard traversal, the 320-pixel layout, 200 percent zoom, and the three route transitions. Run a production build and a consistent Lighthouse mobile profile across all routes, then correct any budget failures before handoff.

## Risks / Trade-offs

- **[Resume-derived copy can become stale]** -> Keep all resume content centralized and label dates explicitly so future updates require data edits rather than layout changes.
- **[Public contact data can attract spam or unwanted calls]** -> Publish only the explicitly authorized telephone, email, and LinkedIn values and keep them centralized for immediate removal if requested.
- **[A single placeholder article makes “latest” selection trivial]** -> Still derive the feature from sorted post data so adding a second article does not require home-page changes.
- **[Security command visuals can imply unauthorized activity]** -> Use reserved `.test` targets, show defensive or benign outcomes, accept no input, and execute nothing.
- **[Terminal animation can harm motion-sensitive or assistive-technology users]** -> Render a complete fallback, suppress incremental announcements, run once, and honor reduced motion before starting.
- **[Static export limits future server features]** -> Treat forms, CMS content, comments, and dynamic search as later changes requiring a deployment and data design decision.
- **[A compact header may crowd narrow screens]** -> Verify at 320 pixels and use a native, keyboard-operable disclosure only if wrapping cannot preserve the requested hierarchy.
- **[Lighthouse scores vary by environment]** -> Run audits against a production build using one documented profile and treat regressions consistently rather than comparing unrelated runs.

## Migration Plan

1. Create the greenfield React application and static route shell in the repository.
2. Add shared tokens, content records, page components, and the progressively enhanced terminal.
3. Add metadata, structured data, sitemap, robots directives, tests, and production checks.
4. Deploy the static output to the selected hosting provider and verify `lucas-reis.dev` routes, canonical URLs, and social previews.
5. Roll back by redeploying the previous static artifact; no data migration or persistent state rollback is required.
