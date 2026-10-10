import { expect, test } from "@playwright/test";

const draftTitle = "Postagem de teste em português";

test("creates and reopens a Portuguese-first Markdown draft without an English version", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;

  await expect(page.getByRole("heading", { name: "Português" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "English" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Português" })).toHaveJSProperty("id", "editorial-pt-heading");
  await page.getByLabel("Título original").fill(draftTitle);
  const portuguese = page.getByRole("region", { name: "Português" });
  await portuguese.getByLabel("Resumo").fill("Resumo de teste");
  const markdown = "# Título\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n```sh\nnmap -sV example.com\n```\n";
  await portuguese.getByLabel("Markdown").fill(markdown);
  await expect(page.getByLabel("Estado do artigo")).toHaveValue("draft");
  await expect(page.getByLabel("Publication date and time")).toHaveCount(0);

  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/item\/postagem-de-teste-em-portugues/, { timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole("region", { name: "Português" }).getByLabel("Markdown")).toHaveValue(markdown);
  await expect(page.getByRole("region", { name: "English" }).getByLabel("Markdown")).toHaveValue("");
  await expect(page.getByLabel("Título original")).toHaveValue(draftTitle);
});

test("keeps a pasted GIF and its Markdown in one save and preserves unsaved work on failure", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;
  await page.getByLabel("Título original").fill("GIF de teste");
  const portuguese = page.getByRole("region", { name: "Português" });
  const markdown = portuguese.getByLabel("Markdown");
  await markdown.fill("Olá mundo");
  await markdown.evaluate((element) => element.setSelectionRange(3, 3));
  const gif = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
  await markdown.evaluate((element, bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], "ola.gif", { type: "image/gif" }));
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
  }, [...gif]);
  await portuguese.getByLabel("Texto alternativo").fill("Saudação");
  await portuguese.getByRole("button", { name: "Inserir no cursor" }).click();
  await expect(markdown).toHaveValue(/^Olá!\[Saudação\]\(\/media\/__pending__\/[a-f0-9]{64}\.gif\) mundo$/);

  let writes = 0;
  await page.route("**/api/keystatic/update", async (route) => {
    writes += 1;
    if (writes === 1) await route.fulfill({ status: 503, body: "Temporary save failure" });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Temporary save failure", { exact: true })).toBeVisible();
  await expect(markdown).toHaveValue(/\/media\/__pending__\//);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/item\/gif-de-teste/, { timeout: 30_000 });
  expect(writes).toBe(2);
  await page.reload();
  await expect(page.getByRole("region", { name: "Português" }).getByLabel("Markdown")).toHaveValue(/\/media\/gif-de-teste\/[a-f0-9]{64}\.gif/);
});
