# Tasks

## 1. Work logo balance

- [x] 1.1 Normalize the five Work logo frames and per-mark optical sizing without modifying image files; verify every mark is uncropped, undistorted, on white, and visually balanced at desktop and 390/320 CSS-pixel widths.
- [x] 1.2 Add or update a focused Work rendering test for logo presence and accessible organization labels; verify the targeted test passes.

## 2. Home-page latest post

- [x] 2.1 Add a home-only compact preview treatment while preserving its English post fields and article destination; verify the home preview is visually quieter than the terminal and the blog-index preview is unchanged.
- [x] 2.2 Add or update a focused rendering test that distinguishes the home variant from the blog index and verifies title, summary, date, reading time, and link; verify the targeted test passes.

## 3. Shared mobile header

- [x] 3.1 Recompose the shared header so ordinary mobile widths show brand and Contact above grouped Work / Blog / About while desktop remains unchanged; verify layout at 390 and 320 CSS pixels and 200 percent zoom without overflow.
- [x] 3.2 Update `SiteHeader` tests for one visible Contact action, all navigation destinations, and mobile/desktop keyboard order; verify targeted tests and a manual Tab/focus check pass.

## 4. Integration and publication

- [x] 4.1 Run the project test/build checks and inspect desktop/mobile screenshots, including reduced-motion behavior; verify no regressions on home, blog index, and an article page.
- [ ] 4.2 Commit only this change's scoped source, tests, and OpenSpec artifacts, push to `main`, and verify the `Publish site` workflow succeeds and public home/blog URLs reflect the release; keep unrelated pre-existing modified files out of the commit.
