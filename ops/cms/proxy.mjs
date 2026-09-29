import { readFile } from "node:fs/promises";

// Multi-platform official nginx manifest, resolved and tested on 2026-09-28.
export const PROXY_IMAGE = "nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94";

export async function renderProxyConfig(hostname) {
  if (!/^[a-f0-9]{12,64}\.lucas-reis\.com$/.test(hostname ?? "")) {
    throw new Error("CMS hostname must be 12–64 lowercase hexadecimal characters followed by .lucas-reis.com");
  }
  const template = await readFile(new URL("./nginx.conf.template", import.meta.url), "utf8");
  return template.replaceAll("__CMS_HOSTNAME__", hostname);
}
