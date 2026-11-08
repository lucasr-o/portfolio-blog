import { expect, test } from "@playwright/test";

for (const width of [1440, 390, 320]) {
  test(`header has one visible Contact link and visual keyboard order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const brand = page.getByRole("link", { name: "lucas-reis — home" });
    const contact = page.getByRole("link", { name: "Contact" });
    const primary = page.getByRole("navigation", { name: "Primary navigation" });

    await expect(contact).toHaveCount(1);
    await expect(primary.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/#work");
    await expect(primary.getByRole("link", { name: "Blog" })).toHaveAttribute("href", /^\/blog\/?$/);
    await expect(primary.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    await expect(contact).toHaveAttribute("href", "/#contact");

    if (width <= 390) {
      const [brandBox, contactBox, navBox] = await Promise.all([
        brand.boundingBox(), contact.boundingBox(), primary.boundingBox(),
      ]);
      expect(Math.abs((brandBox.y + brandBox.height / 2) - (contactBox.y + contactBox.height / 2))).toBeLessThanOrEqual(2);
      expect(navBox.y).toBeGreaterThan(brandBox.y + brandBox.height);
    }

    const expectedOrder = width <= 390
      ? [brand, contact, primary.getByRole("link", { name: "Work" }), primary.getByRole("link", { name: "Blog" }), primary.getByRole("link", { name: "About" })]
      : [brand, primary.getByRole("link", { name: "Work" }), primary.getByRole("link", { name: "Blog" }), primary.getByRole("link", { name: "About" }), contact];
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    for (const link of expectedOrder) {
      await page.keyboard.press("Tab");
      await expect(link).toBeFocused();
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("header reflows in reading order under extreme zoom-equivalent width", async ({ page }) => {
  await page.setViewportSize({ width: 160, height: 800 });
  await page.goto("/");

  const brand = page.getByRole("link", { name: "lucas-reis — home" });
  const contact = page.getByRole("link", { name: "Contact" });
  const primary = page.getByRole("navigation", { name: "Primary navigation" });
  const [brandBox, contactBox, navBox] = await Promise.all([
    brand.boundingBox(), contact.boundingBox(), primary.boundingBox(),
  ]);

  await expect(contact).toHaveCount(1);
  expect(contactBox.y).toBeGreaterThan(brandBox.y + brandBox.height);
  expect(navBox.y).toBeGreaterThan(contactBox.y + contactBox.height);
  const headerOverflow = await page.locator("header").evaluate((header) => header.scrollWidth - header.clientWidth);
  expect(headerOverflow).toBeLessThanOrEqual(1);
});
