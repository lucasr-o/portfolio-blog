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

At this stage, GitHub mode was fixed to `lucasr-o/portfolio-blog` outside local development; the later checks are recorded below.

No AWS, DNS, Pi, Tunnel or Overleaf provisioning has taken place. Lucas signed into GitHub in the browser; no password or token was requested in chat. After explicit approval, the native Keystatic setup created `portfolio-blog-keystatic-lucasr-o` and installed it with **Only select repositories → lucasr-o/portfolio-blog** (one repository). Permissions: contents read/write, metadata read and pull requests read. The callback completed and the CMS dashboard shows Lucas on `main`. Credentials were generated in ignored `apps/cms/.env`, restricted to filesystem mode 600; values are not recorded here. Subsequent real save and session-failure checks are recorded below.

## Development media consistency

The hashed Markdown image initially worked in the production export but returned 404 in development. A static GET route now serves the verified manifest bytes in both modes. The local server returns HTTP 200 with `image/png`. The empty/mixed publication integration suite passed again, including removal of the empty-media technical path. The normal public artifact was restored. Lint and all 67 unit tests across 13 files passed after this correction.

## GitHub editor, preview and proxy preparation (tasks 4.2–4.4, 4.6; 4.5 partial)

- Browser login through the Keystatic GitHub App created the draft `cms-markdown-demonstration` on `main`. It saved raw Markdown as commit `52bbaba`, an image as `6501d97`, then an image reference in Markdown as `45215a9`. The browser preview immediately tracked the latest GitHub revision and loaded the saved UFABC image before any CMS rebuild. The record remains a draft and was absent from the public export.
- A revoked GitHub session produced a native save failure and retained the unsaved indicator; the remote record did not change. Login through the same App restored editing. The temporary test edit was reset in the editor afterward.
- The authoring guide covers source Markdown, images, draft visibility in the public repository, publication, saved preview and session recovery. Its demonstration was followed in the browser.
- Local CMS regression checks: 76 unit tests across 15 files, four CMS browser tests, standalone production build with private/no-store/noindex behavior. The public export built with one eligible placeholder, one excluded demo draft and one published image; all 24 site browser tests passed again.
- A dedicated Nginx proxy configuration and isolated Docker test protect page, API, OAuth callback, assets and preview paths with Basic Auth. The test verified challenges without credentials, cookie/query forwarding, fixed HTTPS upstream host, removal of Basic credentials before the CMS, private/no-store/noindex headers and no token-bearing access logs. It used disposable containers on a dedicated local network and removed them. The real HTTPS Tunnel login/save cycle remains outstanding; task 4.5 is intentionally unchecked.

## CloudFront routing (task 5.1)

`infra/cloudfront/viewer-request.js` rewrites page paths to their actual `index.html` export keys while retaining exported asset and Next payload paths, query strings and headers. Three tests compare it with the full current `out/` inventory and cover `/`, `/blog` with and without slash, the article path, absent article mapping to an absent key, traversal and malformed paths. AWS function association and actual edge HTTP status checks remain under tasks 7.2/7.4.

## Static release workflow (tasks 5.2–5.7)

- `prepare-release.mjs` planned the current real export: 50 files and one eligible article, with commit/run/cutoff, SHA-256, exact object keys, MIME type and mutable/immutable cache metadata. Unsafe paths and symlinks fail validation.
- `release-upload.mjs` checks every file hash before any storage mutation. It saves private snapshot bytes, then the snapshot manifest as a commit marker, rechecks the `main` HEAD, and writes versioned assets before mutable documents. The AWS adapter restricts object keys to project prefixes and uses SSE-S3.
- `release-deploy.mjs` uses the previous manifest for withdrawal, waits for CloudFront invalidation, executes page/asset/404 smoke checks, and records current state only after success. Failure injections covered upload, withdrawal, invalidation, smoke, state write and first-release failure; previous bytes are restored and obsolete mutable pages removed. Old immutable bundles remain until safe retention.
- The dedicated `rollback.yml` restores only a successful retained artifact with its original bytes. `retention.yml` protects the active release, five newest successes and snapshots younger than 30 days, deleting only recorded old snapshot objects and unreferenced bundles; unknown/incomplete manifests are skipped.
- `checks.yml` accepts pull requests without AWS/OIDC permissions. `release.yml` serializes production mutations, verifies before deploy, pins external actions to verified full SHAs, checks commit/cutoff staleness, and schedules due-post checks at minutes 7/22/37/52. A no-change schedule skips build, upload and invalidation. Missing/read-failed state is not silently treated as unchanged. `release.yml` leaves deploy disabled until all AWS repository variables exist.
- Unit suite: 97 tests across 22 files; lint clean. YAML for all four workflows parsed. The AWS-specific CLI path remains unexercised until resources are provisioned; task 7.4 will verify real OIDC, S3 and CloudFront behavior.

## CMS container and Pi operations (tasks 6.2–6.4; 6.1 partial)

- A two-stage, pinned Node 24 Alpine image builds the Keystatic standalone app without local `.env` files. The local amd64 image was rebuilt after baking the **public** GitHub App slug; inspection confirmed no `.env`, and an isolated read-only container returned `{"service":"portfolio-blog-cms","status":"ok"}` from `/api/health`. The temporary container was removed. The GHCR workflow builds linux/arm64, but its real published digest/ARM64 health still need to pass on GitHub before task 6.1 can be marked complete.
- `ops/cms/compose.yml` has exactly three dedicated services (CMS, Nginx Basic proxy, new cloudflared Tunnel), one private project network, no host ports or Docker socket, pinned proxy/Tunnel images, read-only filesystems, dropped capabilities, memory/PID ceilings and bounded logs. The Compose fixture test validated the rendered service graph and the proxy configuration. Nothing was deployed on the Pi.
- The updater is constrained to the fixed GHCR repository and digest, validates ARM64/source/current GitHub `main` revision twice, checks health, records a failed digest and restores the previous one on failure. Seven Node tests cover approved update, no-op/failed candidate, invalid image, network/metadata/head mismatch, broken startup, failed health/recovery and fixed Compose service targeting. A dedicated systemd timer/service passed `systemd-analyze verify`.
- `docs/cms-operations.md` covers credentials and permissions, new Tunnel and exact callback, isolated setup, health checks, updater pause/recovery and protecting Overleaf. It explicitly requires verifying host Node and avoids replacing it or invoking global Docker cleanup. The steps remain unexecuted on the Pi pending the final hostname and live service setup.
- Validation after these changes: lint clean, 98 Vitest tests across 22 files, 7 standalone updater tests, Compose validation and YAML parsing for all five workflows. No AWS, DNS, Pi or Overleaf resource has yet been changed.
