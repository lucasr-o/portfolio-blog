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

- A two-stage, pinned Node 24 Alpine image builds the Keystatic standalone app without local `.env` files. The local amd64 image was rebuilt after baking the **public** GitHub App slug; inspection confirmed no `.env`, and an isolated read-only container returned `{"service":"portfolio-blog-cms","status":"ok"}` from `/api/health`. The temporary container was removed. GitHub Actions run `36369226912` built, pushed and health-tested the real linux/arm64 image. `docker buildx imagetools inspect` without registry credentials confirmed the public GHCR index digest `sha256:0d9c32eae515cf4a198fe4aaae18e77381cc90930eb25079bdf75437ef5d77ad` with an arm64 manifest. The pinned base and lockfile make the build inputs reproducible; CI ties the image label to commit `d85b081`.
- `ops/cms/compose.yml` has exactly three dedicated services (CMS, Nginx Basic proxy, new cloudflared Tunnel), one private project network, no host ports or Docker socket, pinned proxy/Tunnel images, read-only filesystems, dropped capabilities, memory/PID ceilings and bounded logs. The Compose fixture test validated the rendered service graph and the proxy configuration. Nothing was deployed on the Pi.
- The updater is constrained to the fixed GHCR repository and digest, validates ARM64/source/GitHub `main`, checks health, records a failed digest and restores the previous one on failure. It permits a later `main` only if GitHub's comparison proves no CMS build input changed after the image revision; missing/incomplete comparison fails closed. Eight Node tests cover approved update, frontend-only follow-up, rejection of CMS changes, no-op/failed candidate, invalid image, network/metadata/head mismatch, broken startup, failed health/recovery and fixed Compose service targeting. A dedicated systemd timer/service passed `systemd-analyze verify`.
- `docs/cms-operations.md` covers credentials and permissions, new Tunnel and exact callback, isolated setup, health checks, updater pause/recovery and protecting Overleaf. It explicitly requires verifying host Node and avoids replacing it or invoking global Docker cleanup. The steps remain unexecuted on the Pi pending the final hostname and live service setup.
- Validation after these changes: lint clean, 99 Vitest tests across 22 files, 8 standalone updater tests, Compose validation and YAML parsing for the workflows. Both first GitHub runs passed; **Publish site** skipped AWS deployment because repository variables have not been configured. No AWS, DNS, Pi or Overleaf resource has yet been changed.

## Manual OIDC diagnostic (task 7.3 partial)

With Lucas's explicit approval for each run, **Inspect main OIDC claims** ran twice. The first job requested a temporary token but failed because its character allowlist rejected GitHub's current immutable-ID `sub`; it did not print the token or subject. The allowlist was corrected to permit only bounded printable characters, and [run #2](https://github.com/lucasr-o/portfolio-blog/actions/runs/36370199307) succeeded. It printed only `iss=https://token.actions.githubusercontent.com`, `aud=sts.amazonaws.com`, and `sub=repo:lucasr-o@75533514/portfolio-blog@1391300735:ref:refs/heads/main`. That subject was measured before the `prod` environment and is now obsolete for the production jobs.

## Production configuration reconciliation (2026-09-29; tasks 7.3–7.4 partial)

- GitHub environment `prod` has five variables: `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `CLOUDFRONT_DISTRIBUTION_ID`, `CLOUDFRONT_DOMAIN`, and `S3_BUCKET`; their values are recorded in `aws-manual.md`. No AWS access keys are stored as environment secrets. The environment deployment rule was changed to exact branch `main` and verified in the GitHub UI.
- The manual OIDC workflow was bound to `prod` and published as commit `fb82fff`. Lucas authorized exactly one new run. [Run #3](https://github.com/lucasr-o/portfolio-blog/actions/runs/36519829869/job/109250040898) succeeded and printed only `iss=https://token.actions.githubusercontent.com`, `aud=sts.amazonaws.com`, and `sub=repo:lucasr-o@75533514/portfolio-blog@1391300735:environment:prod`. No token was printed. The AWS role trust policy still requires confirmation/update to this exact subject before enabling the release workflow.
- The release, rollback and retention jobs were adjusted locally to bind `prod` and read `vars.*`. These changes are not yet on `main`; a real AWS deployment has not run. The user has supplied resource IDs/ARNs but the configuration of S3, CloudFront, ACM, IAM and billing has not been verified in the AWS console.
- Initial read-only Pi check via SSH key showed the four Overleaf-related containers still running; about 1.9 GiB of RAM and 18 GiB of disk were available. Docker Compose v5.1.1 and Node v20.20.2 are installed. The public repository was then cloned to the new, dedicated `/home/rp4/portfolio-blog-cms` directory at commit `fb82fff`; only `ops/cms/secrets`, `generated` and `runtime` were created with host mode `0700`. No service was started, and `docker ps` confirmed all four Overleaf containers remain running and healthy as before.
- Lucas revoked the Tunnel token previously exposed in chat. The Cloudflare route targets `http://cms-proxy:8080`, but the dedicated connector cannot start until a fresh token is generated and placed privately on the Pi. The old token must not be reused. The old portfolio Tunnel was deleted by Lucas; DNS rollback to the former site must be re-evaluated rather than assumed available.

## First production attempt and CMS hostname correction (2026-09-29)

- Lucas confirmed the AWS role trust policy now uses the exact `prod` subject. Commit `79548dc` pushed the production-bound workflows. [Publish site #10](https://github.com/lucasr-o/portfolio-blog/actions/runs/36520283568) passed AWS OIDC preflight and the complete verification job (100 Vitest tests plus build/browser checks). The deploy assumed the role, uploaded a first candidate, then failed its smoke check because a missing route returned HTTP 403 instead of 404. Its documented first-release recovery withdrew the public candidate because no prior release existed. The domain was **not** cut over and deployment is **not** accepted. Public CloudFront probes after recovery returned 403 for `/`, `/404.html`, and an unknown path, consistent with the withdrawn `site/` objects; the custom error mapping must be confirmed in CloudFront before retrying.
- The dedicated Pi checkout was fast-forwarded to `79548dc`. Existing Keystatic GitHub App environment variables were transferred over SSH to `ops/cms/secrets/cms.env` (mode `0600`) without printing values. An ignored `ops/cms/.env` with the approved image digest and chosen hostname was copied with mode `0600`.
- Generating the proxy configuration on the Pi exposed a validation mismatch: the chosen `4fa8522f3d6b` label has 12 hexadecimal characters, while the original code required 16. The proxy validator and isolated tests were corrected locally to allow 12–64 characters; invalid/short labels remain rejected. Local Compose and proxy tests passed using the actual hostname. This correction is committed as `6f9b203`; no production deploy was made from that commit while the CloudFront error configuration is being checked. No CMS containers or Tunnel were started.
- With Lucas's explicit approval, **Publish site** was manually disabled in the GitHub UI after the failed run, preventing scheduled retries and push deployments until the CloudFront 403→404 response is fixed. GitHub displayed “Workflow disabled successfully” and “This workflow was disabled manually.” It must be re-enabled explicitly before the next controlled release.

## Dedicated CMS activated on Pi (2026-09-29; task 8.1)

- Lucas placed a replacement Tunnel token privately on the Pi and created the `lucas` Basic Auth hash locally. Both files were restricted to mode `0600`; the secrets directory is `0700`. The originally disclosed token remains revoked. The dedicated proxy and Tunnel services run as the verified owner UID/GID `1000:1000`, so neither secret had to be made world-readable. Commit `75491ac` contains this Compose adjustment and its local fixture test.
- The Pi checkout was updated to `75491ac`. In `/home/rp4/portfolio-blog-cms/ops/cms`, `docker compose up -d` completed successfully, creating only the dedicated `portfolio-blog-cms_editor` network and `cms`, `proxy`, `tunnel` containers. The CMS and proxy are healthy; the Tunnel is running. None publish a host port. The public `https://4fa8522f3d6b.lucas-reis.com/keystatic` request without credentials returned HTTP 401 with a Basic challenge, `Cache-Control: private, no-store`, and `X-Robots-Tag: noindex, nofollow`.
- Post-start check showed `overleaf`, `overleaf-cloudflared`, `overleaf-redis` still running and `overleaf-mongo` healthy, with no configuration changes to them. The Pi reported about 1.9 GiB available RAM and 17 GiB free disk. The production GitHub App callback and the authenticated editor/save/preview cycle remain outstanding, so task 8.2 and 4.5 remain unchecked.
