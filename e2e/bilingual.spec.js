import { expect, test } from "@playwright/test";

test.skip(!process.env.BLOG_TEST_BILINGUAL, "Requires the generated bilingual export fixture");

test("keeps Portuguese previews and same-post language switching coherent", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/pt/blog/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 3, name: "Artigo em português" })).toBeVisible();
  await expect(page.getByText("English-only article")).toHaveCount(0);
  await expect(page.getByText("Resumo do artigo")).toBeVisible();
  await expect(page.getByText("1 min de leitura")).toBeVisible();
  await page.getByRole("link", { name: "Artigo em português" }).click();
  await expect(page).toHaveURL(/\/pt\/blog\/bilingual-demo\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Artigo em português" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Marca da UFABC" })).toBeVisible();
  const switcher = page.getByRole("navigation", { name: "Idioma do artigo" });
  await expect(switcher.getByRole("link", { name: "PT" })).toHaveAttribute("aria-current", "page");
  await switcher.getByRole("link", { name: "EN" }).focus();
  await expect(switcher.getByRole("link", { name: "EN" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/blog\/bilingual-demo\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "English article" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Article language" }).getByRole("link", { name: "PT" })).toBeVisible();
  await page.getByRole("navigation", { name: "Article language" }).getByRole("link", { name: "PT" }).click();
  await page.getByRole("link", { name: /Voltar ao blog/ }).click();
  await expect(page).toHaveURL(/\/pt\/blog\/$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("publishes distinct canonical, alternates and structured data for each article language", async ({ page }) => {
  for (const [path, locale, title] of [
    ["/blog/bilingual-demo/", "en", "English article"],
    ["/pt/blog/bilingual-demo/", "pt-BR", "Artigo em português"],
  ]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://lucas-reis.com${path}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", "https://lucas-reis.com/blog/bilingual-demo/");
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute("href", "https://lucas-reis.com/pt/blog/bilingual-demo/");
    const article = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent));
    expect(article).toMatchObject({ headline: title, inLanguage: locale, mainEntityOfPage: `https://lucas-reis.com${path}` });
  }
});
