import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/blog/",
  "/pt/blog/",
  "/blog/security-reviews-that-move-at-product-speed/",
  "/no-such-page/",
];

for (const route of routes) {
  test(`${route} has accessible landmarks, names, and content`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const unnamedLinks = await page.locator("a").evaluateAll((links) => links.filter((link) => !link.getAttribute("aria-label") && !link.textContent.trim()).length);
    expect(unnamedLinks).toBe(0);

    const results = await new AxeBuilder({ page }).analyze();
    const severeViolations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
    expect(severeViolations).toEqual([]);
  });
}

test("keyboard focus is visible and reaches primary navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const focusStyle = await page.getByRole("link", { name: "Skip to content" }).evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(3);

  for (let press = 0; press < 5; press += 1) await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});

test("reduced motion exposes the finished terminal without typing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("figure").getByText(/0 findings/)).toBeVisible();
  await expect(page.locator("figure button, figure input, figure textarea")).toHaveCount(0);
  const revealAnimation = await page.locator(".reveal-on-load").first().evaluate((element) => getComputedStyle(element).animationName);
  expect(revealAnimation).toBe("none");
});

test("body links retain a non-color affordance", async ({ page }) => {
  await page.goto("/blog/");
  const readLink = page.getByRole("link", { name: /Read article/ });
  await expect(readLink).toContainText("→");
  const decoration = await readLink.evaluate((element) => getComputedStyle(element).textDecorationLine);
  expect(decoration).toContain("underline");
});
