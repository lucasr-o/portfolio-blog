import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("saves and reopens raw Markdown as an incomplete draft", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;
  await page.getByLabel("Title", { exact: true }).fill("Markdown round trip");
  const markdown = '# Source heading\n\nA [link](https://example.com).\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n```js\n  const greeting = "hello";\n```\n\nHard break.  \nNext line.\n';
  await page.getByLabel("Markdown", { exact: true }).fill(markdown);
  await expect(page.getByLabel("Markdown", { exact: true })).toHaveValue(markdown);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/item\/markdown-round-trip/, { timeout: 20_000 });
  await page.reload();
  await expect(page.getByLabel("Markdown", { exact: true })).toHaveValue(markdown);
  await expect(page.getByLabel("Summary", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: /Draft — not on the website/ })).toBeVisible();
  await expect(page.getByText(/Drafts are not confidential/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Blog posts", exact: true }).first()).toBeVisible();
});

test("keeps unsaved Markdown and shows an error when persistence fails", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;
  await page.getByLabel("Title", { exact: true }).fill("Failed save demonstration");
  await page.getByLabel("Markdown", { exact: true }).fill("## Keep this unsaved text\n");
  await page.route("**/api/keystatic/update", (route) => route.fulfill({ status: 503, body: "Persistence unavailable — test fixture" }));
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Persistence unavailable — test fixture", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByLabel("Markdown", { exact: true })).toHaveValue("## Keep this unsaved text\n");
  await page.reload();
  await page.goto("/keystatic/collection/posts");
  await expect(page.getByRole("link", { name: "Failed save demonstration", exact: true })).toHaveCount(0);
});

test("rejects unsupported and oversized uploads before saving", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;
  await page.getByLabel("Title", { exact: true }).fill("Invalid image demonstration");
  let writes = 0;
  await page.route("**/api/keystatic/update", (route) => { writes += 1; return route.abort(); });
  const png = await readFile("content/media/markdown-demo/ufabc.png");
  const invalidFiles = [
    { name: "unsupported.gif", mimeType: "image/gif", buffer: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"), message: /GIF are not supported/ },
    { name: "oversized.png", mimeType: "image/png", buffer: Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]), message: /Image exceeds 5 MiB/ },
  ];
  for (const { message, ...file } of invalidFiles) {
    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Choose file", exact: true }).click();
    await (await chooserPromise).setFiles(file);
    await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(/\/create$/);
    expect(writes).toBe(0);
    await page.getByRole("button", { name: "Remove invalid image" }).click();
  }
});

test("does not expose preview content or images without a GitHub session", async ({ request }) => {
  const preview = await request.get("/preview/cms-markdown-demonstration");
  // Next dev overrides page cache headers; the standalone production check
  // separately requires private + no-store on these same routes.
  expect(preview.headers()["cache-control"]).toContain("no-cache");
  expect(preview.headers()["x-robots-tag"]).toContain("noindex");
  expect(await preview.text()).toContain("Sign in to Keystatic with GitHub");
  const image = await request.get(`/preview/media/${"a".repeat(40)}/cms-markdown-demonstration/${"b".repeat(64)}.png`);
  expect(image.status()).toBe(401);
  expect(image.headers()["cache-control"]).toBe("private, no-store");
});
