import { expect, test } from "@playwright/test";

test("keeps search data lazy and finds body-only terms from a shared URL", async ({ page }) => {
  const searchRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("/blog-search/")) searchRequests.push(request.url());
  });
  await page.goto("/blog/");
  await expect(page.getByRole("heading", { level: 1, name: "Posts." })).toBeVisible();
  expect(searchRequests).toHaveLength(0);
  await page.getByRole("searchbox", { name: "Search posts" }).fill("uncertainty");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/\?q=uncertainty$/);
  await expect(page.getByRole("region", { name: "Search results" }).getByRole("link", { name: "Security reviews that move at product speed" })).toBeVisible();
  expect(searchRequests).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole("region", { name: "Search results" }).getByRole("link", { name: "Security reviews that move at product speed" })).toBeVisible();
  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByRole("region", { name: "Recent posts" })).toBeVisible();
});

test("distinguishes no result from index failure and supports retry", async ({ page }) => {
  await page.goto("/blog/?q=notarealwordqz");
  await expect(page.getByText("No posts found. Try different keywords.")).toBeVisible();
  let failed = false;
  await page.route("**/blog-search/en.json", (route) => {
    if (!failed) { failed = true; return route.abort(); }
    return route.continue();
  });
  await page.goto("/blog/?q=uncertainty");
  await expect(page.getByText("Search could not load.")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("region", { name: "Search results" }).getByRole("link", { name: "Security reviews that move at product speed" })).toBeVisible();
});

test("keeps hostile URL input inert and layout usable at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/blog/?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&page=%3Cscript%3E");
  await expect(page.getByText("No posts found. Try different keywords.")).toBeVisible();
  expect(await page.locator("img[onerror], script[src*=alert]").count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://lucas-reis.com/blog/");
});

test("does not expose a numbered archive route when the collection fits on page one", async ({ request }) => {
  expect((await request.get("/blog/page/2/")).status()).toBe(404);
  expect((await request.get("/pt/blog/page/2/")).status()).toBe(404);
});
