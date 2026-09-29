import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { request as httpRequest } from "node:http";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { PROXY_IMAGE, renderProxyConfig } from "../ops/cms/proxy.mjs";

// Only disposable, uniquely named local resources; never contact the Pi.
const project = `portfolio-blog-proxy-test-${randomBytes(6).toString("hex")}`;
const directory = await mkdtemp(join(tmpdir(), `${project}-`));
const hostname = "4fa8522f3d6b.lucas-reis.com";
const password = randomBytes(32).toString("hex");
const containers = [];
let networkCreated = false;

function command(program, args, options = {}) {
  const result = spawnSync(program, args, { encoding: "utf8", timeout: 60_000, ...options });
  if (result.error || result.status !== 0) {
    // Do not dump command inputs, authorization headers or OAuth queries.
    throw new Error(`${program} failed: ${result.error?.message ?? result.stderr?.trim() ?? result.status}`);
  }
  return result.stdout.trim();
}

async function configFile(name, value) {
  const path = join(directory, name);
  await writeFile(path, value, { mode: name === "cms.htpasswd" ? 0o600 : 0o444 });
  return path;
}

function start(name, config, options = []) {
  command("docker", ["run", "-d", "--name", name, "--network", project,
    "--user", "1000:1000", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true",
    "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m", "--memory", "64m", "--pids-limit", "64",
    "--mount", `type=bind,src=${config},dst=/etc/nginx/nginx.conf,readonly`,
    ...options, "--entrypoint", "nginx", PROXY_IMAGE, "-g", "daemon off;"]);
  containers.push(name);
}

try {
  // Hostname is validated before any generated configuration is used.
  await assert.rejects(() => renderProxyConfig("example.com; include /etc/passwd;"));
  await assert.rejects(() => renderProxyConfig("4fa8522f3d6.lucas-reis.com"));
  const proxy = await configFile("nginx.conf", await renderProxyConfig(hostname));
  const hash = command("htpasswd", ["-niB", "editor"], { input: `${password}\n` });
  const credentials = await configFile("cms.htpasswd", `${hash}\n`);
  const upstream = await configFile("upstream.conf", `
    worker_processes 1;
    pid /tmp/nginx.pid;
    error_log /dev/stderr crit;
    events { worker_connections 64; }
    http {
      access_log off;
      client_body_temp_path /tmp/body;
      proxy_temp_path /tmp/proxy;
      fastcgi_temp_path /tmp/fastcgi;
      uwsgi_temp_path /tmp/uwsgi;
      scgi_temp_path /tmp/scgi;
      server {
        listen 3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Robots-Tag "index, follow";
        location / {
          default_type application/json;
          return 200 '{"host":"$host","protocol":"$http_x_forwarded_proto","forwardedHost":"$http_x_forwarded_host","forwarded":"$http_forwarded","authorization":"$http_authorization","cookie":"$http_cookie","method":"$request_method","uri":"$request_uri"}';
        }
      }
    }
  `);
  command("docker", ["network", "create", project]);
  networkCreated = true;
  start(`${project}-upstream`, upstream, ["--network-alias", "cms"]);
  start(`${project}-proxy`, proxy, ["--publish", "127.0.0.1::8080",
    "--mount", `type=bind,src=${credentials},dst=/run/secrets/cms.htpasswd,readonly`]);
  const binding = command("docker", ["port", `${project}-proxy`, "8080/tcp"]);
  assert.match(binding, /^127\.0\.0\.1:\d+$/);
  const port = Number(binding.split(":")[1]);
  const request = (path, headers = {}, method = "GET") => new Promise((resolve, reject) => {
    const outgoing = httpRequest({ hostname: "127.0.0.1", port, path, method,
      headers: { Host: hostname, ...headers } }, (incoming) => {
      const chunks = [];
      incoming.on("data", (chunk) => chunks.push(chunk));
      incoming.on("end", () => resolve(new Response(Buffer.concat(chunks), {
        status: incoming.statusCode, headers: incoming.headers,
      })));
      incoming.on("error", reject);
    });
    outgoing.setTimeout(5000, () => outgoing.destroy(new Error("request timed out")));
    outgoing.on("error", reject);
    outgoing.end();
  });
  let ready = false;
  let lastResult = "no response";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await request("/");
      lastResult = String(response.status);
      if (response.status === 401) { ready = true; break; }
    } catch (error) { lastResult = error.cause?.code ?? error.message; }
    await delay(100);
  }
  if (!ready) {
    const state = command("docker", ["inspect", `${project}-proxy`, "--format", "{{.State.Status}}:{{.State.ExitCode}}"]);
    const logs = spawnSync("docker", ["logs", `${project}-proxy`], { encoding: "utf8" });
    const upstreamState = command("docker", ["inspect", `${project}-upstream`, "--format", "{{.State.Status}}:{{.State.ExitCode}}"]);
    const upstreamLogs = spawnSync("docker", ["logs", `${project}-upstream`], { encoding: "utf8" });
    throw new Error(`isolated proxy did not become ready (${state}, HTTP ${lastResult}): ${logs.stderr.trim()}; upstream ${upstreamState}: ${upstreamLogs.stderr.trim()}`);
  }
  const headersArePrivate = (response) => {
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  };
  const paths = ["/", "/keystatic", "/api/health", "/api/keystatic/github/login",
    "/api/keystatic/github/oauth/callback?code=synthetic-test&state=synthetic-state",
    "/api/keystatic/update", "/_next/static/test.js", "/preview/draft", "/preview/media/test/image.png"];
  for (const path of paths) {
    for (const authorization of [undefined, "Basic ZWRpdG9yOndyb25n"]) {
      const response = await request(path, authorization ? { Authorization: authorization } : {});
      assert.equal(response.status, 401, path);
      assert.match(response.headers.get("www-authenticate"), /^Basic /);
      headersArePrivate(response);
      assert.doesNotMatch(await response.text(), /synthetic-test|authorization|protocol/);
    }
  }
  const authorization = `Basic ${Buffer.from(`editor:${password}`).toString("base64")}`;
  for (const path of paths) {
    const response = await request(path, { Authorization: authorization, Cookie: "session=synthetic-cookie",
      "X-Forwarded-Host": "attacker.invalid", "X-Forwarded-Proto": "http", Forwarded: "host=attacker.invalid" });
    assert.equal(response.status, 200, path);
    headersArePrivate(response);
    const body = await response.json();
    assert.deepEqual(body, { host: hostname, protocol: "https", forwardedHost: hostname,
      forwarded: "", authorization: "", cookie: "session=synthetic-cookie", method: "GET", uri: path });
  }
  assert.equal((await request("/api/keystatic/update", {}, "POST")).status, 401);
  const authorizedPost = await request("/api/keystatic/update", { Authorization: authorization }, "POST");
  assert.equal((await authorizedPost.json()).method, "POST");
  assert.equal((await request("/", { Host: "attacker.invalid", Authorization: authorization })).status, 421);
  for (const name of containers) {
    assert.doesNotMatch(command("docker", ["logs", name]), /synthetic-test|synthetic-cookie|Authorization|editor:/);
  }
  console.log("CMS proxy passed: every path challenged, private headers, credential stripping, fixed HTTPS host, cookie/query forwarding and isolated non-root containers. Real GitHub OAuth over the final HTTPS Tunnel remains a separate acceptance check.");
} finally {
  for (const name of containers.reverse()) command("docker", ["rm", "--force", name]);
  if (networkCreated) command("docker", ["network", "rm", project]);
  await rm(directory, { recursive: true, force: true });
}
