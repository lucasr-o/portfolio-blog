import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderProxyConfig } from "./proxy.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));
const env = await readFile(path.join(root, ".env"), "utf8");
const match = /^CMS_HOSTNAME=([^\r\n#]+)$/m.exec(env);
if (!match) throw new Error("CMS_HOSTNAME is missing from ops/cms/.env");
const config = await renderProxyConfig(match[1].trim());
const generated = path.join(root, "generated");
await mkdir(generated, { recursive: true, mode: 0o700 });
await writeFile(path.join(generated, "nginx.conf"), config, { mode: 0o644 });
console.info("Rendered the private CMS proxy configuration.");
