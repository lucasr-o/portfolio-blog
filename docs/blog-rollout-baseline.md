# Blog rollout baseline — 2026-10-09

This is a read-only comparison checklist for `streamline-blog-publishing`, not a release instruction. Repository base: `63e9b133c73425d8a891f403a005eea4a7b44e15` on `main`. The locally generated export below also includes the narrowly reviewed repairs to the CWES image alt text (`Pepe` in both languages) and the existing image path in the unpublished placeholder draft. No production deployment has been made from these repairs.

## Editorial and public routes

| Record | Current state | English route | Portuguese route |
| --- | --- | --- | --- |
| `review-cwes` | Published; both languages visible; shared date `2026-10-09T18:00:00.000Z` | `/blog/review-cwes/` | `/pt/blog/review-cwes/` |
| `security-reviews-that-move-at-product-speed` | Draft; image path repaired locally | None | None |
| `cms-markdown-demonstration` | Draft | None | None |

The local English home feature and both blog indexes point to `review-cwes`. Both search indexes include exactly one article; the sitemap contains the English and Portuguese article routes. Five content-hashed media files are exported. The current release manifest code uses schema `1`, one English `posts` list and a `portuguesePosts` subset; the new design must permit a Portuguese-only article without assuming subset membership.

During the compatibility period, the public reader accepts legacy English-at-root YAML, an intermediate flat `pt`/`en` test shape, and the final root-title-plus-`editorial` shape. The live Keystatic editor still writes only the legacy shape. No content migration or editor cutover is implied by the reader change. Existing URLs and English-first public selection remain stable until a new-format record is deliberately saved.

## Comparison hashes from the local static export

The export was generated with Node 24.19.0 and a publication cutoff of `2026-10-09T19:34:00.638Z`. These hashes capture the current rendered result and are expected to change when layout or metadata changes; compare route presence, content and locale semantics in addition to bytes.

| Path | SHA-256 |
| --- | --- |
| `out/index.html` | `451d7c61ce0f13d2ee8a9339f9dbc8ef671c4b7ffa1e06de5a236fec806ace09` |
| `out/blog/index.html` | `cef2a9bc2aa5b75a134fd20b97f6dbd1251725d8ea731d872159f7ea6ad68309` |
| `out/pt/blog/index.html` | `2436cc55831d2991daf9753a7a6be0113bc5c6a43431784872ac27468b52975c` |
| `out/blog/review-cwes/index.html` | `ae905c928317f1880b8226036e42eefadbca60ab6aa7851ca83672387e22ece9` |
| `out/pt/blog/review-cwes/index.html` | `b34dd022309aca17216dfb883d1f02b5955016901f00cbbb49a6e250f0ff7cb4` |
| `out/sitemap.xml` | `165bf0be50750bf6703eda1b3db00a5c7f3d549f9a11652e3cb14f882cc5f22e` |
| `out/blog-search/en.json` | `e0ed47cdf00450f7ed5eac893815823f9b64090d789ff170f2d21cc98d1f34e7` |
| `out/blog-search/pt-BR.json` | `766798a10082da02fb9e4383fedc82e420b876614fb2b289d9862615212866e8` |

## CMS and release state

The isolated Pi CMS container was healthy when inspected read-only. Its exact image was `ghcr.io/lucasr-o/portfolio-blog-cms@sha256:894284f4eef261e0e9a0e596ffa6f6e02bb7caf2ffa2cc5723f915c77ce45296`. The dedicated proxy and tunnel were healthy; no Overleaf container was touched. The site workflow still has a 15-minute `schedule` in addition to `push` and manual dispatch. The current production S3 `state/current.json` manifest has **not** been read because this workspace has no usable AWS credentials; inspect and preserve that active manifest before a production cutover.

The assertions formerly tied to the placeholder-only content inventory have been updated or isolated in fixtures. The full unit suite and static export succeed after the two editorial metadata repairs noted above.
