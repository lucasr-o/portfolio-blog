import { expect, test } from "@playwright/test";

const postPath = "/blog/security-reviews-that-move-at-product-speed/";

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

test("connects home anchors, latest writing, blog, and article navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View my work" }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator("#work")).toBeInViewport();

  await page.getByRole("link", { name: "Security reviews that move at product speed" }).click();
  await expect(page).toHaveURL(new RegExp(`${postPath}$`));
  await page.getByRole("link", { name: /Back to blog/ }).click();
  await expect(page).toHaveURL(/\/blog\/$/);

  await page.getByRole("link", { name: "Work" }).click();
  await expect(page).toHaveURL(/\/#work$/);

  await page.goto("/blog/");
  for (let press = 0; press < 7; press += 1) {
    await page.keyboard.press("Tab");
    if (await page.getByRole("link", { name: "Contact" }).evaluate((element) => element === document.activeElement)) break;
  }
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("brand returns from the blog to the beginning of the home page", async ({ page }) => {
  await page.goto("/#contact");
  await page.getByRole("navigation", { name: "Footer navigation" }).getByRole("link", { name: "Blog" }).click();
  await page.getByRole("link", { name: "lucas-reis — home" }).click();

  await expect(page).toHaveURL(/\/#main-content$/);
  await expect(page.getByRole("heading", { name: "Security that moves with the product." })).toBeInViewport();
});

for (const viewport of [
  { label: "320px", width: 320, height: 760 },
  { label: "200% reflow equivalent", width: 640, height: 900 },
]) {
  test(`keeps all routes readable without clipping at ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of ["/", "/blog/", postPath]) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await expect(page.locator("footer")).toBeVisible();
    }

    await page.goto(postPath);
    const paragraphWidth = await page.locator("article section p").first().evaluate((element) => element.getBoundingClientRect().width);
    expect(paragraphWidth).toBeLessThanOrEqual(720);
  });
}

test("reserves terminal space while the one-shot animation completes", async ({ page }) => {
  await page.addInitScript(() => {
    window.__layoutShiftScore = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__layoutShiftScore += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.goto("/");
  const terminal = page.locator("figure").first();
  await terminal.scrollIntoViewIfNeeded();
  const initialHeight = await terminal.evaluate((element) => element.getBoundingClientRect().height);
  await expect(page.getByTestId("animated-terminal-transcript")).toContainText("0 findings", { timeout: 6_000 });
  const finalHeight = await terminal.evaluate((element) => element.getBoundingClientRect().height);
  const layoutShiftScore = await page.evaluate(() => window.__layoutShiftScore);

  expect(Math.abs(finalHeight - initialHeight)).toBeLessThanOrEqual(1);
  expect(layoutShiftScore).toBeLessThan(0.1);
});

test("sets the terminal reveal state before hydration without a sharp-to-blurred flash", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-scroll-reveal", "enabled");
  await expect(page.locator("[class*=terminalWrap]")).toHaveCSS("filter", "blur(4px)");
});

test("uses CSS-only progressive reveal motion", async ({ page }) => {
  await page.goto("/blog/");
  const animation = await page.locator(".reveal-on-load").evaluate((element) => {
    const style = getComputedStyle(element);
    return { name: style.animationName, duration: style.animationDuration };
  });
  expect(animation.name).toContain("fade-in-rise");
  expect(animation.duration).toBe("1.2s");
});

test("keeps the individual article free from reveal motion", async ({ page }) => {
  await page.goto(postPath);
  await expect(page.locator("article .reveal-on-load, article .reveal-on-scroll")).toHaveCount(0);
});

test("reveals home content as individual items enter the viewport", async ({ page }) => {
  await page.goto("/");

  expect(await page.locator("#work ol > li.reveal-on-scroll").count()).toBeGreaterThan(1);
  expect(await page.locator("ul[class*=simpleList] > li.reveal-on-scroll").count()).toBeGreaterThan(1);
  expect(await page.locator("ul[class*=credentialList] > li.reveal-on-scroll").count()).toBeGreaterThan(1);
  await expect(page.locator("#contact > .reveal-on-scroll")).toHaveCount(1);

  const target = page.locator("#work ol > li.reveal-on-scroll").nth(2);
  await expect(page.locator("html")).toHaveAttribute("data-scroll-reveal", "enabled");
  await expect(target).toHaveCSS("filter", "blur(4px)");
  await target.scrollIntoViewIfNeeded();
  await expect(target).toHaveClass(/is-visible/);
  await expect(target).toHaveCSS("filter", "none", { timeout: 2_500 });
});

test("shows organization marks and the supplied portrait without replacing text labels", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#work img[alt='']")).toHaveCount(5);
  const logoBackgrounds = await page.locator("[class*=organizationLogoFrame], [class*=institutionLogoFrame]").evaluateAll((frames) =>
    frames.map((frame) => getComputedStyle(frame).backgroundColor),
  );
  expect(new Set(logoBackgrounds)).toEqual(new Set(["rgb(255, 255, 255)"]));
  await expect(page.getByRole("img", { name: "Portrait of Lucas Reis" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Portrait of Lucas Reis" })).toHaveAttribute("src", /lucas-reis-profile\.jpeg/);
  await expect(page.getByText("Federal University of ABC", { exact: true })).toBeAttached();
  await expect(page.getByText("SENAI-SP", { exact: true })).toBeAttached();
});

test("uses quick tactile feedback on links without changing the Contact interaction", async ({ page }) => {
  await page.goto("/");

  const workLink = page.getByRole("link", { name: "Work", exact: true });
  const contactLink = page.getByRole("link", { name: "Contact", exact: true });
  await expect(workLink).toHaveClass(/touch-feedback/);
  await expect(contactLink).not.toHaveClass(/touch-feedback/);

  const transitionDuration = await workLink.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration).toContain("0.12s");
  await workLink.hover();
  await expect(workLink).toHaveCSS("color", "rgb(7, 89, 183)");
});

test("keeps credential content aligned when a date is absent", async ({ page }) => {
  await page.goto("/");
  const contentOffsets = await page.locator("ul[class*=credentialList] li").evaluateAll((rows) =>
    rows.map((row) => row.children[1].getBoundingClientRect().x),
  );

  expect(Math.max(...contentOffsets) - Math.min(...contentOffsets)).toBeLessThanOrEqual(1);
});
