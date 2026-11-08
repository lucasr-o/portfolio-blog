# Design

## Context

See `proposal.md` for motivation. The home page renders Work and Latest Writing in `app/(en)/page.jsx`; Work uses source paths from `data/profile.js` and styling in `app/home.module.css`. The reusable `PostPreview` appears in both the home feature and blog index. The shared `SiteHeader` currently nests Contact beside the primary links; its narrow layout puts only the brand on the first row. The six Work assets mix wide wordmarks and square marks, so identical image-box sizing does not yield equal apparent size. Production publishing is already handled by the `Publish site` GitHub workflow on `main`.

## Goals / Non-Goals

**Goals:** Improve optical balance and hierarchy with narrowly scoped styling; preserve semantic reading order, keyboard use, and the existing mobile breakpoints' 320-pixel behavior; avoid regressions to blog index cards or article pages.

**Non-Goals:** Replace organization artwork, rewrite experience or article copy, change blog publication rules, add new image dependencies, or alter the deployment pipeline.

## Decisions

1. **Normalize logo presentation rather than the source files.** Keep the approved assets on white, equal-size frames. Add per-mark optical sizing where the square and wide source proportions require it, without stretching or cropping. This avoids editing or licensing new brand files; a one-size-fits-all `object-fit: contain` rule alone leaves the current imbalance.
2. **Give the home feature its own compact variant.** Keep `PostPreview`'s blog-index treatment intact. The home variant uses a light surface, restrained border/accent, reduced vertical padding and title scale, while preserving the complete data-backed summary, date, reading time, tags, and link. A global change to `.featured` would unintentionally alter the blog index.
3. **Recompose the header with explicit layout regions.** Keep the brand and primary navigation semantic, and render one desktop and one mobile Contact link, with exactly one displayed and keyboard-reachable at any viewport. This gives desktop the focus order brand → Work / Blog / About → Contact and mobile the visual/focus order brand → Contact → Work / Blog / About. CSS grid places the mobile brand and Contact on row one and the primary links on row two. At extreme zoom, allow the first row to wrap instead of clipping. This is more predictable than changing visual order with CSS or using `display: contents` on the navigation landmark.
4. **Verify responsive states and publish through the existing workflow.** Build and test locally, inspect screenshots at desktop, 390 and 320 CSS pixels plus zoom/reduced-motion and keyboard focus, then push a scoped commit to `main`. Confirm the release workflow and public CloudFront output. Do not include the unrelated pre-existing modified operations/OpenSpec files in the commit.

## Risks / Trade-offs

- [Per-logo optical sizing needs manual judgment] → Compare all five Work marks together at desktop and phone widths; retain source aspect ratios and check transparent padding.
- [Two responsive Contact instances could both become focusable] → Use mutually exclusive responsive display rules and verify only the visible instance enters the Tab order at each breakpoint.
- [A light home feature might lose distinction] → Keep a clear border, typographic hierarchy, and small tertiary accent; verify contrast and article affordances.
- [Automated release can fail independently of visual changes] → Check workflow result and public routes before reporting publication; if it fails, leave the tested commit intact and report the failure rather than claiming production success.

## Migration Plan

No data migration. A scoped commit triggers the existing production workflow. If the released presentation regresses, revert that commit through the normal workflow; CMS content and routes are unaffected.
