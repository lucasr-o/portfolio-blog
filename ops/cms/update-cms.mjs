import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { DIGEST_IMAGE, IMAGE_NAME, updateCms } from "./update-plan.mjs";

const execFile = promisify(execFileCallback);
const root = fileURLToPath(new URL("./", import.meta.url));
const envPath = path.join(root, ".env");
const runtimePath = path.join(root, "runtime");
const composeArgs = ["compose", "--project-directory", root,
  "-f", path.join(root, "compose.yml")];

async function command(program, args, timeout = 120_000) {
  try {
    const { stdout } = await execFile(program, args, { cwd: root, timeout, maxBuffer: 2_000_000 });
    return stdout.trim();
  } catch (error) {
    // Docker stderr can contain URLs or local details; do not echo credentials.
    throw new Error(`${program} operation failed (${error.code ?? error.signal ?? "unknown"})`);
  }
}

function configuredImage(contents) {
  const matches = [...contents.matchAll(/^CMS_IMAGE=([^\r\n]+)$/gm)];
  if (matches.length !== 1 || !DIGEST_IMAGE.test(matches[0][1])) {
    throw new Error("The dedicated Compose .env needs exactly one approved CMS digest");
  }
  return matches[0][1];
}

async function writeImage(contents, image) {
  if (!DIGEST_IMAGE.test(image)) throw new Error("Unapproved CMS image");
  const next = contents.replace(/^CMS_IMAGE=[^\r\n]+$/m, `CMS_IMAGE=${image}`);
  const temp = path.join(root, `.env.update-${process.pid}`);
  await writeFile(temp, next, { mode: 0o600 });
  await rename(temp, envPath);
  await command("docker", [...composeArgs, "up", "-d", "--no-deps", "cms"]);
}

async function healthy() {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      const id = await command("docker", [...composeArgs, "ps", "-q", "cms"], 10_000);
      if (id && /^[a-f0-9]{12,64}$/.test(id)) {
        const state = await command("docker", ["inspect", "--format", "{{.State.Health.Status}}", id], 10_000);
        if (state === "healthy") return true;
        if (state === "unhealthy") return false;
      }
    } catch { /* CMS may still be starting */ }
    await delay(2000);
  }
  return false;
}

async function mainHead() {
  const response = await fetch("https://api.github.com/repos/lucasr-o/portfolio-blog/branches/main", {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Could not verify GitHub main (${response.status})`);
  const { commit } = await response.json();
  if (!/^[a-f0-9]{40}$/.test(commit?.sha ?? "")) throw new Error("Invalid GitHub main response");
  return commit.sha;
}

async function validateDedicatedCompose() {
  const config = JSON.parse(await command("docker", [...composeArgs, "config", "--format", "json"]));
  if (config.name !== "portfolio-blog-cms" ||
      JSON.stringify(Object.keys(config.services).sort()) !== JSON.stringify(["cms", "proxy", "tunnel"]) ||
      Object.values(config.services).some((service) => service.ports || service.network_mode ||
        JSON.stringify(service).includes("docker.sock"))) {
    throw new Error("Compose no longer describes only the isolated CMS services");
  }
}

async function candidateDigest() {
  await command("docker", ["pull", `${IMAGE_NAME}:main`]);
  const inspect = JSON.parse(await command("docker", ["image", "inspect", `${IMAGE_NAME}:main`,
    "--format", "{{json .}}"]));
  const candidates = [...new Set((inspect.RepoDigests ?? []).filter((value) => DIGEST_IMAGE.test(value)))];
  if (candidates.length !== 1) throw new Error("GHCR main tag did not resolve to one approved digest");
  return candidates[0];
}

await validateDedicatedCompose();
await mkdir(runtimePath, { recursive: true, mode: 0o700 });
let env = await readFile(envPath, "utf8");
const currentImage = configuredImage(env);
let previousImage = null;
try {
  previousImage = (await readFile(path.join(runtimePath, "previous-image"), "utf8")).trim();
  if (previousImage && !DIGEST_IMAGE.test(previousImage)) throw new Error("Invalid previous CMS digest");
} catch (error) { if (error.code !== "ENOENT") throw error; }

if (!await healthy()) {
  if (!previousImage || previousImage === currentImage) throw new Error("Current CMS is unhealthy and has no distinct previous digest");
  await writeImage(env, previousImage);
  if (!await healthy()) throw new Error("Previous CMS image also failed health check");
  await writeFile(path.join(runtimePath, "failed-image"), currentImage + "\n", { mode: 0o600 });
  throw new Error("Recovered previous CMS image after an interrupted or unhealthy update; inspect before trying a new image");
}

const candidateImage = await candidateDigest();
let failedImage = null;
try {
  failedImage = (await readFile(path.join(runtimePath, "failed-image"), "utf8")).trim();
  if (failedImage && !DIGEST_IMAGE.test(failedImage)) throw new Error("Invalid failed CMS digest record");
} catch (error) { if (error.code !== "ENOENT") throw error; }

const result = await updateCms({ currentImage, candidateImage, failedImage,
  readMainHead: mainHead,
  pull: async (image) => { await command("docker", ["pull", image]); },
  inspect: async (image) => {
    const info = JSON.parse(await command("docker", ["image", "inspect", image,
      "--format", "{{json .}}"]));
    return { architecture: info.Architecture, source: info.Config?.Labels?.["org.opencontainers.image.source"],
      revision: info.Config?.Labels?.["org.opencontainers.image.revision"] };
  },
  apply: async (image) => {
    if (image !== currentImage) {
      await writeFile(path.join(runtimePath, "previous-image"), currentImage + "\n", { mode: 0o600 });
    }
    await writeImage(env, image);
    env = await readFile(envPath, "utf8");
  },
  healthy,
  rememberFailure: async (image) => {
    await writeFile(path.join(runtimePath, "failed-image"), image + "\n", { mode: 0o600 });
  },
});
console.info(`CMS updater: ${result.status}; digest ${result.image}.`);
