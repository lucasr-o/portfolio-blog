import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const fixture = await mkdtemp(path.join(tmpdir(), "portfolio-cms-test-"));
await mkdir(path.join(fixture, "content/posts"), { recursive: true });
if (process.env.CMS_TEST_EDITOR_V2 === "1") {
  await writeFile(path.join(fixture, "content/posts/english-origin.yaml"), [
    "title: English origin",
    "editorial:",
    "  titleLocale: en",
    "  status: draft",
    "  author: Lucas Reis de Oliveira da Silva",
    "  pt:",
    "    publish: false",
    "    summary: ''",
    "    body: ''",
    "  en:",
    "    publish: false",
    "    title: English origin",
    "    summary: Existing English summary",
    "    body: '## Existing English Markdown'",
    "",
  ].join("\n"));
}
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "apps/cms", "--hostname", "127.0.0.1", "--port", "3002"], {
  stdio: "inherit",
  env: { ...process.env, CMS_TEST_OUTPUT: "1", CMS_LOCAL_CONTENT_ROOT: fixture, NEXT_PUBLIC_CMS_STORAGE: "local",
    NEXT_PUBLIC_CMS_EDITOR_V2: process.env.CMS_TEST_EDITOR_V2 === "1" ? "1" : "0" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
