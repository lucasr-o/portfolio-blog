import { expect, test } from "@playwright/test";

const expectedRoutes = [
  {
    path: "/",
    title: "Lucas Reis — Application Security Engineer",
    canonical: "https://lucas-reis.com/",
  },
  {
    path: "/blog/",
    title: "Blog | Lucas Reis",
    canonical: "https://lucas-reis.com/blog/",
  },
  {
    path: "/pt/blog/",
    title: "Blog em português | Lucas Reis",
    canonical: "https://lucas-reis.com/pt/blog/",
  },
  {
    path: "/blog/security-reviews-that-move-at-product-speed/",
    title: "Security reviews that move at product speed | Lucas Reis",
    canonical: "https://lucas-reis.com/blog/security-reviews-that-move-at-product-speed/",
  },
];

for (const route of expectedRoutes) {
  test(`${route.path} exports unique matching metadata`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", route.canonical);
  });
}

test("structured data matches visible person and article records", async ({ page }) => {
  await page.goto("/");
  const person = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent));
  expect(person).toMatchObject({
    "@type": "Person",
    name: "Lucas Reis de Oliveira da Silva",
    url: "https://lucas-reis.com",
    jobTitle: "Application Security Engineer",
  });
  await expect(page.getByText(person.name, { exact: false })).toBeVisible();

  await page.goto("/blog/security-reviews-that-move-at-product-speed/");
  const article = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent));
  expect(article).toMatchObject({
    "@type": "BlogPosting",
    headline: "Security reviews that move at product speed",
    datePublished: "2026-09-18T12:00:00.000Z",
  });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.headline);
});

test("robots and sitemap expose only eligible canonical public routes", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap: https://lucas-reis.com/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  for (const route of expectedRoutes) expect(xml).toContain(route.canonical);
  expect((xml.match(/<url>/g) ?? [])).toHaveLength(4);
  expect(xml).not.toContain("/pt/blog/security-reviews-that-move-at-product-speed/");
});

test("indexes are reciprocal language alternates while English-only articles are not", async ({ page }) => {
  for (const path of ["/blog/", "/pt/blog/"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", "https://lucas-reis.com/blog/");
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute("href", "https://lucas-reis.com/pt/blog/");
  }
  await page.goto("/blog/security-reviews-that-move-at-product-speed/");
  await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveCount(0);
  const article = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent));
  expect(article.inLanguage).toBe("en");
});

test("uses the Lucas Reis mark as the site icon", async ({ page, request }) => {
  await page.goto("/");
  const iconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(iconHref).toMatch(/^\/icon\.svg/);

  const icon = await request.get(iconHref);
  expect(icon.ok()).toBeTruthy();
  const svg = await icon.text();
  expect(svg).toContain("#1A3A5C");
  expect(svg).not.toContain(">lr<");
});
