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

test("edits a pre-existing English-origin record without changing its slug or English source", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/item/english-origin");
  await treeLoaded;
  await expect(page.getByLabel("Título original")).toHaveValue("English origin");
  const english = page.getByRole("region", { name: "English" });
  await expect(english.getByLabel("Markdown")).toHaveValue("## Existing English Markdown");
  const portuguese = page.getByRole("region", { name: "Português" });
  await portuguese.getByLabel("Título em português").fill("Origem em inglês");
  await portuguese.getByLabel("Resumo").fill("Resumo novo");
  await portuguese.getByLabel("Markdown").fill("## Novo texto em português");
  await page.getByRole("button", { name: /Save|Update/ }).click();
  await expect(page).toHaveURL(/\/item\/english-origin/);
  await page.reload();
  await expect(page.getByLabel("Título original")).toHaveValue("English origin");
  await expect(page.getByRole("region", { name: "Português" }).getByLabel("Markdown")).toHaveValue("## Novo texto em português");
  await expect(page.getByRole("region", { name: "English" }).getByLabel("Markdown")).toHaveValue("## Existing English Markdown");
});

test("keeps a pasted GIF and its Markdown in one save and preserves unsaved work on failure", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;
  await page.getByLabel("Título original").fill("GIF de teste");
  const portuguese = page.getByRole("region", { name: "Português" });
  const markdown = page.locator("#editorial-pt-body");
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
  await markdown.evaluate((element, bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], "ola-de-novo.gif", { type: "image/gif" }));
    element.setSelectionRange(element.value.length, element.value.length);
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
  }, [...gif]);
  await portuguese.getByLabel("Texto alternativo").fill("Outro aceno");
  await portuguese.getByRole("button", { name: "Inserir no cursor" }).click();
  await expect(markdown).toHaveValue(/!\[Outro aceno\]\(\/media\/__pending__\/[a-f0-9]{64}\.gif\)$/);

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
  const saved = await page.locator("#editorial-pt-body").inputValue();
  const references = [...saved.matchAll(/\/media\/gif-de-teste\/[a-f0-9]{64}\.gif/g)].map((match) => match[0]);
  expect(references).toHaveLength(2);
  expect(references[0]).toBe(references[1]);
});

test("supports the file picker, drop, keyboard insertion and one asset shared by both languages", async ({ page }) => {
  const treeLoaded = page.waitForResponse((response) => response.url().endsWith("/api/keystatic/tree") && response.ok());
  await page.goto("/keystatic/collection/posts/create");
  await treeLoaded;
  await page.getByLabel("Título original").fill("Arquivo compartilhado");
  const portuguese = page.getByRole("region", { name: "Português" });
  const english = page.getByRole("region", { name: "English" });
  const ptBody = page.locator("#editorial-pt-body");
  const enBody = page.locator("#editorial-en-body");
  await ptBody.fill("## Texto\n\n");
  await enBody.fill("## Text\n\n");
  const gif = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACAUwAOw==", "base64");
  const chooser = page.waitForEvent("filechooser");
  await portuguese.getByText("Escolher imagem ou GIF").click();
  await (await chooser).setFiles({ name: "ola.gif", mimeType: "image/gif", buffer: gif });
  await portuguese.getByLabel("Texto alternativo").fill("Saudação");
  await portuguese.getByLabel("Texto alternativo").press("Tab");
  await expect(portuguese.getByRole("button", { name: "Inserir no cursor" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(ptBody).toHaveValue(/!\[Saudação\]\(\/media\/__pending__\/[a-f0-9]{64}\.gif\)/);

  await enBody.evaluate((element, bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], "hello.gif", { type: "image/gif" }));
    element.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  }, [...gif]);
  await english.getByLabel("Alternative text").fill("Greeting");
  await english.getByRole("button", { name: "Insert at cursor" }).click();
  await expect(enBody).toHaveValue(/!\[Greeting\]\(\/media\/__pending__\/[a-f0-9]{64}\.gif\)/);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/item\/arquivo-compartilhado/, { timeout: 30_000 });
  await page.reload();
  const ptSource = await page.locator("#editorial-pt-body").inputValue();
  const enSource = await page.locator("#editorial-en-body").inputValue();
  const reference = /\/media\/arquivo-compartilhado\/[a-f0-9]{64}\.gif/;
  expect(ptSource.match(reference)?.[0]).toBe(enSource.match(reference)?.[0]);
  expect(ptSource).toContain("![Saudação]");
  expect(enSource).toContain("![Greeting]");
});
