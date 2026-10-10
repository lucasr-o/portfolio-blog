import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

function aws(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("aws", [...args, "--no-cli-pager", "--output", "json"], {
      env: { ...process.env, AWS_PAGER: "" }, stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => { output += chunk; if (output.length > 2_000_000) child.kill(); });
    child.stderr.on("data", (chunk) => { error += chunk; if (error.length > 100_000) child.kill(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(JSON.parse(output || "{}")) :
      reject(new Error(`CloudFront operation failed (${code}): ${error.slice(0, 500).trim()}`)));
  });
}

export function createReleaseRuntime({ distributionId, domain, token }) {
  if (!/^[A-Z0-9]{8,32}$/.test(distributionId ?? "") ||
      !/^[a-z0-9-]+\.cloudfront\.net$/.test(domain ?? "")) {
    throw new Error("CloudFront distribution ID and domain are required");
  }
  return {
    cdn: {
      async invalidateAndWait(pathPattern) {
        if (pathPattern !== "/*") throw new Error("Invalid invalidation path");
        const result = await aws(["cloudfront", "create-invalidation", "--distribution-id", distributionId,
          "--paths", pathPattern]);
        const id = result.Invalidation?.Id;
        if (!/^[A-Z0-9]{8,32}$/.test(id ?? "")) throw new Error("Invalid invalidation result");
        await aws(["cloudfront", "wait", "invalidation-completed", "--distribution-id", distributionId,
          "--id", id]);
      },
    },
    async mainHead() {
      if (!token) throw new Error("Workflow GitHub token is required");
      const response = await fetch("https://api.github.com/repos/lucasr-o/portfolio-blog/branches/main", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10" }, signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Could not verify main branch HEAD (${response.status})`);
      const body = await response.json();
      if (!/^[a-f0-9]{40}$/.test(body.commit?.sha ?? "")) throw new Error("Invalid main branch response");
      return body.commit.sha;
    },
    async smoke(manifest) {
      const asset = manifest.files.find((file) => file.immutable) ??
        manifest.files.find((file) => file.path.endsWith(".js"));
      if (!asset) throw new Error("Release has no testable asset");
      const representativeGif = manifest.files.find((file) => /^media\/posts\/[a-f0-9]{64}\.gif$/.test(file.path));
      const representativePng = manifest.files.find((file) => /^media\/posts\/[a-f0-9]{64}\.png$/.test(file.path));
      const assetTypes = new Map([asset, representativeGif, representativePng]
        .filter(Boolean).map((file) => [`/${file.path}`, file.contentType.split(";")[0]]));
      const searchPaths = ["en", "pt-BR"].filter((locale) =>
        manifest.files.some((file) => file.path === `blog-search/${locale}.json`)).map((locale) => `/blog-search/${locale}.json`);
      if (searchPaths.length === 1) throw new Error("Incomplete public search artifacts");
      const paths = ["/", "/blog/", ...searchPaths, ...assetTypes.keys(),
        ...manifest.posts.slice(0, 1).map((slug) => `/blog/${slug}/`)];
      if (manifest.files.some((file) => file.path === "pt/blog/index.html")) {
        paths.push("/pt/blog/", ...(manifest.portuguesePosts ?? []).slice(0, 1).map((slug) => `/pt/blog/${slug}/`));
      }
      for (const uri of paths) {
        const response = await fetch(`https://${domain}${uri}`, {
          redirect: "manual", signal: AbortSignal.timeout(15_000),
        });
        if (response.status !== 200) throw new Error(`CloudFront smoke failed: ${uri} HTTP ${response.status}`);
        const type = response.headers.get("content-type") ?? "";
        const expected = uri.startsWith("/blog-search/") ? "application/json" :
          assetTypes.get(uri) ?? "text/html";
        if (!type.startsWith(expected)) throw new Error(`CloudFront content type mismatch: ${uri}`);
      }
      const missing = `/blog/does-not-exist-${randomBytes(8).toString("hex")}/`;
      const notFound = await fetch(`https://${domain}${missing}`, {
        redirect: "manual", signal: AbortSignal.timeout(15_000),
      });
      if (notFound.status !== 404) throw new Error(`CloudFront unknown route was not HTTP 404 (${notFound.status})`);
    },
  };
}
