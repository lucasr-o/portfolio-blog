import { expect, test } from "@playwright/test";

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
