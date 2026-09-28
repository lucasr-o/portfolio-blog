import { createHash } from "node:crypto";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertReleaseManifest } from "./release-plan.mjs";

const SHA256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function uploadRelease({ manifest, exportDirectory, store, beforePublic = async () => {} }) {
  assertReleaseManifest(manifest);
  const prepared = [];
  for (const file of manifest.files) {
    const bytes = await readFile(path.join(exportDirectory, file.path));
    if (bytes.length !== file.bytes || SHA256(bytes) !== file.sha256) {
      throw new Error(`Export changed since manifest creation: ${file.path}`);
    }
    prepared.push({ file, bytes });
  }
  const snapshotPrefix = `releases/${manifest.releaseId}/`;
  // The manifest is the snapshot's commit marker and must be uploaded last.
  for (const { file, bytes } of prepared) {
    await store.putObject(`${snapshotPrefix}files/${file.path}`, bytes, {
      contentType: file.contentType, cacheControl: "private, no-store", createOnly: true,
    });
  }
  await store.putObject(`${snapshotPrefix}manifest.json`,
    Buffer.from(JSON.stringify(manifest)), {
      contentType: "application/json", cacheControl: "private, no-store", createOnly: true,
    });
  await beforePublic();
  for (const { file, bytes } of prepared) {
    await store.putObject(file.key, bytes, {
      contentType: file.contentType, cacheControl: file.cacheControl,
    });
  }
  return { snapshotPrefix, uploaded: prepared.length };
}

function runAws(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("aws", [...args, "--no-cli-pager", "--output", "json"], {
      stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, AWS_PAGER: "" },
    });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => { output += chunk; if (output.length > 2_000_000) child.kill(); });
    child.stderr.on("data", (chunk) => { error += chunk; if (error.length > 100_000) child.kill(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`AWS CLI operation failed (${code}): ${error.slice(0, 500).trim()}`));
    });
  });
}

export async function withAwsObjectStore(bucket, callback) {
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket ?? "")) {
    throw new Error("Invalid S3 bucket name");
  }
  const directory = await mkdtemp(path.join(tmpdir(), "portfolio-blog-upload-"));
  const uploadPath = path.join(directory, "upload");
  const downloadPath = path.join(directory, "download");
  try {
    function validateKey(key, deleteMode = false) {
      const allowed = /^(?:site|releases)\/[A-Za-z0-9._~!$&'()+,;=@/-]+$/.test(key) ||
        key === "state/current-release.json";
      const deletableRelease = /^releases\/[a-f0-9]{40}-[0-9]{1,20}-[1-9][0-9]*\/(?:manifest\.json|success\.json|files\/[A-Za-z0-9._~!$&'()+,;=@/-]+)$/.test(key);
      if (!allowed || key.split("/").some((part) => part === ".." || part === "." || part === "") ||
          (deleteMode && !key.startsWith("site/") && key !== "state/current-release.json" && !deletableRelease)) {
        throw new Error("Object key outside approved prefixes");
      }
    }
    const store = {
      async putObject(key, bytes, { contentType, cacheControl, createOnly = false }) {
        validateKey(key);
        await writeFile(uploadPath, bytes, { mode: 0o600 });
        await runAws(["s3api", "put-object", "--bucket", bucket, "--key", key,
          "--body", uploadPath, "--content-type", contentType,
          "--cache-control", cacheControl, "--server-side-encryption", "AES256",
          ...(createOnly ? ["--if-none-match", "*"] : [])]);
      },
      async getObject(key) {
        validateKey(key);
        await runAws(["s3api", "get-object", "--bucket", bucket, "--key", key, downloadPath]);
        return readFile(downloadPath);
      },
      async getOptionalCurrent() {
        try { return await this.getObject("state/current-release.json"); }
        catch (error) {
          if (/NoSuchKey|Not Found|\(404\)/.test(error.message)) return null;
          throw error;
        }
      },
      async deleteObject(key) {
        validateKey(key, true);
        await runAws(["s3api", "delete-object", "--bucket", bucket, "--key", key]);
      },
      async listReleaseObjects() {
        const objects = [];
        let token = null;
        const seen = new Set();
        do {
          const response = JSON.parse(await runAws(["s3api", "list-objects-v2", "--bucket", bucket,
            "--prefix", "releases/", ...(token ? ["--continuation-token", token] : [])]));
          objects.push(...(response.Contents ?? []));
          if (!response.IsTruncated) break;
          token = response.NextContinuationToken;
          if (!token || seen.has(token)) throw new Error("Incomplete or repeated S3 release listing");
          seen.add(token);
        } while (true);
        return objects;
      },
    };
    return await callback(store);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
