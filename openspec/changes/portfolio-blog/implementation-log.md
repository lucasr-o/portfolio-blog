# Implementation evidence

## 2026-09-27 — baseline (task 1.1)

The existing frontend was tested before application changes, using Node 24.19.0 and pnpm 11.25.0. The workspace initially had no commits or remote; existing source files were preserved.

| Check | Result |
| --- | --- |
| `pnpm lint` | Passed |
| `pnpm test` | 24 tests passed, 9 files |
| `pnpm build` | Passed; home, blog index, placeholder article, 404, icon, robots and sitemap exported |
| `pnpm audit:bundle` | Passed; 611,347 exported JavaScript bytes; only ScrollRevealManager and SecurityTerminal client boundaries |
| `CI=1 pnpm test:e2e` | 24 Chromium tests passed, including accessibility, 320px layout, metadata, navigation and terminal first-paint behavior |

The initial sandboxed browser run could not start its local server (`uv_interface_addresses`). Running the same browser suite with local-server permission passed; this was an environment restriction, not an application defect.

No AWS, DNS, Raspberry Pi or Overleaf resources were modified.

## Repository (task 1.2)

Created public `https://github.com/lucasr-o/portfolio-blog`, default branch `main`, with baseline commit `632e5c5`. Reviewed the 89-file staged inventory and scanned for credential patterns before push. Local agent installations, environment files, keys, dependencies and generated artifacts are ignored. Existing SVG/archive whitespace warnings were left unchanged to preserve the baseline. The old repository was not modified.

## Workspace and editorial foundation (tasks 1.3–2.5)

- Four workspace projects, lockfile installation verified with `pnpm install --frozen-lockfile`.
- Independent CMS build passed (`pnpm build:cms`); its health route is not part of the public export.
- Existing site dev server on port 3000 was preserved and returned HTTP 200. `pnpm dev:cms` started the separate loopback server on port 3001; `/` and `/api/health` returned HTTP 200. A duplicate site startup was refused by Next's lock; the pre-existing server was not stopped.
- The content contract, UTC selector and image manifest have automated tests for Markdown round-trip, structural errors, incomplete drafts, schedule boundaries, timezone display, corrupt/oversized images, traversal and excluded media.
- The original article is preserved as YAML/Markdown with the same slug, author and prose (domain corrected to `.com`), followed by formatting demonstrations. The original record survives only as a test fixture.
- The editorial guide is validated by reading its checked-in article example with the production parser and media validator.

## Empty static collection compatibility (task 3.2)

`pnpm test:publication` builds a temporary content collection without modifying real articles. A genuinely empty collection fails in Next 16.3.6 during page-data collection. The installed implementation in `next/dist/build/static-paths/app.js` explicitly rejects an empty `generateStaticParams()` result when `output: export` is active (error E1454); `build/index.js` also requires a generated dynamic path.

Lucas requested continuation after the proposed compatibility adjustment. The design now explicitly permits a build-only not-found parameter for the empty collection, with an artifact audit rejecting any emitted public files for it. No hidden requirement to retain one published article has been introduced.

`node scripts/test-publication-export.mjs` now passes: an empty collection exports only the expected public pages, and a second fixture containing a draft and a future scheduled article excludes their paths and content from the entire artifact. Next's intermediate `out/blog/__empty__/` folder is removed before auditing; any remaining generated path containing that reserved parameter fails the audit. The normal site export is restored after the fixture runs.

## Public integration verification (tasks 3.1–3.5)

- Lint clean; 64 unit tests passed across 12 files.
- All 24 public Chromium tests passed after updating the paragraph locator from the old section-based markup to the same visible paragraph in Markdown. The first run's timeouts were obsolete test selectors, not page overflow.
- 320px and reflow layouts, accessibility, logo-to-top navigation, Contact feedback, scroll reveals and terminal first paint passed. Articles remain free of reveal motion.
- Canonical, primary heading and description exist in initial static HTML for all three routes. Canonical origin and JSON-LD use `.com`.
- Bundle audit: 612,574 JavaScript bytes, same two public client boundaries; CMS/editor dependencies absent.
- Mobile Lighthouse: home 98 Performance / 100 Accessibility / 100 Best Practices / 100 SEO; blog and article scored 100 in all four categories.
- The separate Keystatic production build passed without supplying secrets; API handlers read credentials at request time, not while building the image. Repository authentication has not yet been configured or tested.

## Browser editing (task 4.1)

The isolated CMS Chromium test passes: creates an incomplete draft, enters source Markdown including a table, fenced JavaScript, indentation and a hard line break, saves, reloads and reads back the exact string. The record exists only in a temporary fixture directory; no real article was changed. The editor exposes only the blog collection, defaults to draft and explicitly warns that the production repository is public.

Date fields use native text inputs with an explicit timezone; serialization normalizes non-empty timestamps to UTC. Keystatic's native datetime field was not used because this installed version serializes timezone-less values. Empty optional dates are omitted by the native text serializer and accepted by the shared validator.

GitHub mode is fixed to `lucasr-o/portfolio-blog` outside local development. Actual GitHub login/save/expiration handling, upload rules and saved-revision preview remain pending tasks; local authoring is not evidence that those integrations are complete.

No AWS, DNS, Pi, Tunnel or Overleaf provisioning has taken place. Lucas signed into GitHub in the browser; no password or token was requested in chat. After explicit approval, the native Keystatic setup created `portfolio-blog-keystatic-lucasr-o` and installed it with **Only select repositories → lucasr-o/portfolio-blog** (one repository). Permissions: contents read/write, metadata read and pull requests read. The callback completed and the CMS dashboard shows Lucas on `main`. Credentials were generated in ignored `apps/cms/.env`, restricted to filesystem mode 600; values are not recorded here. Real save and session-failure checks remain pending.

## Development media consistency

The hashed Markdown image initially worked in the production export but returned 404 in development. A static GET route now serves the verified manifest bytes in both modes. The local server returns HTTP 200 with `image/png`. The empty/mixed publication integration suite passed again, including removal of the empty-media technical path. The normal public artifact was restored. Lint and all 67 unit tests across 13 files passed after this correction.
