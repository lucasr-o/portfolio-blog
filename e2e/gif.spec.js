import { expect, test } from "@playwright/test";

test.skip(!process.env.BLOG_TEST_GIF, "Requires the representative animated GIF export fixture");

test("keeps mobile and reduced-motion loads poster-first until explicit playback", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const gifRequests = [];
  page.on("request", (request) => {
    if (/\/media\/posts\/[a-f0-9]{64}\.gif$/.test(new URL(request.url()).pathname)) gifRequests.push(request);
  });
  await page.goto("/pt/blog/gif-demo/");
  const image = page.getByRole("img", { name: "Animação de teste" });
  const play = page.getByRole("button", { name: "Reproduzir animação" });
  await expect(play).toBeVisible();
  await expect(image).toHaveAttribute("src", /\.png$/);
  await expect(image).toHaveAttribute("loading", "lazy");
  await expect(image).toHaveAttribute("width", "640");
  await expect(image).toHaveAttribute("height", "360");
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(gifRequests).toHaveLength(0);
  expect(Number(process.env.BLOG_TEST_GIF_POSTER_BYTES)).toBeLessThanOrEqual(512 * 1024);
  const before = await image.boundingBox();
  await play.focus();
  await page.keyboard.press("Enter");
  await expect(image).toHaveAttribute("src", /\.gif$/);
  await expect(page.getByRole("button", { name: "Pausar animação" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => gifRequests.length).toBe(1);
  expect(Number(process.env.BLOG_TEST_GIF_BYTES)).toBeLessThanOrEqual(5 * 1024 * 1024);
  const after = await image.boundingBox();
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Pausar animação" }).click();
  await expect(image).toHaveAttribute("src", /\.png$/);
  await context.close();
});
