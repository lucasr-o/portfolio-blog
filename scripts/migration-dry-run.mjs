import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { migrateLegacyRecord } from "@portfolio/blog-content/migration";
import { ENGLISH, PORTUGUESE, articlePath, selectLocalizedPosts } from "@portfolio/blog-content/locale";
import { parsePostYaml } from "@portfolio/blog-content/model";
import { referencedImages } from "@portfolio/blog-content/references";
import { buildSearchIndex } from "@portfolio/blog-content/search";

const run = promisify(execFile);
const root = process.cwd();
const folder = join(root, "content/posts");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function publicLists(records, cutoff) {
  return [ENGLISH, PORTUGUESE].map((locale) => {
    const posts = selectLocalizedPosts(records, cutoff, locale);
    const routes = posts.map((post) => articlePath(post, locale));
    const media = [...new Set(posts.flatMap((post) => referencedImages(post).map((image) => image.src)))].sort();
    return { locale, homeFeature: locale === ENGLISH ? posts[0]?.slug ?? null : null,
      routes, sitemapArticles: routes, searchSha256: sha256(JSON.stringify(buildSearchIndex(posts, locale))),
      media };
  });
}

async function firstCommit(filename) {
  const { stdout } = await run("git", ["-C", root, "log", "--first-parent", "--reverse", "--format=%cI", "HEAD", "--", `content/posts/${filename}`], {
    encoding: "utf8", maxBuffer: 1024 * 1024,
  });
  return stdout.trim().split("\n").find(Boolean) ?? null;
}

async function main() {
  const applying = process.argv[2] === "--apply";
  if ((!applying && process.argv.length > 2) || (applying && process.argv.length !== 4)) {
    throw new Error("Run without arguments for a dry run, or --apply <exact planSha256> after review.");
  }
  const expectedPlan = applying ? process.argv[3] : null;
  if (applying && !/^[a-f0-9]{64}$/.test(expectedPlan)) throw new Error("Expected a 64-character reviewed plan hash.");
  const { stdout: currentHead } = await run("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" });
  const head = currentHead.trim();
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error("Could not identify the current Git revision.");
  const files = (await readdir(folder)).filter((name) => name.endsWith(".yaml")).sort();
  const entries = [];
  const conversions = [];
  const beforePosts = [];
  const afterPosts = [];
  for (const filename of files) {
    const slug = filename.slice(0, -5);
    const absolute = join(folder, filename);
    const metadata = await lstat(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`Unsafe article entry: ${filename}`);
    const original = await readFile(absolute, "utf8");
    const record = parsePostYaml(original, slug);
    beforePosts.push(record);
    if (record.en !== undefined || record.createdAt !== undefined) {
      afterPosts.push(record);
      entries.push({ slug, format: "already localized", status: record.status });
      continue;
    }
    const converted = migrateLegacyRecord(record, await firstCommit(filename));
    afterPosts.push(converted.post);
    conversions.push({ filename, original, proposed: converted.yaml });
    entries.push({
      slug, format: "legacy → editorial", status: record.status,
      originalSha256: sha256(original),
      proposedSha256: sha256(converted.yaml),
      creationSource: converted.creationSource,
      droppedDraftDates: converted.droppedDraftDates,
      languages: converted.comparisons,
    });
  }
  const cutoff = new Date().toISOString();
  const beforePublic = publicLists(beforePosts, cutoff);
  const afterPublic = publicLists(afterPosts, cutoff);
  const publicListsUnchanged = JSON.stringify(beforePublic) === JSON.stringify(afterPublic);
  const planSha256 = createHash("sha256").update(JSON.stringify({ head, entries })).digest("hex");
  const report = { mode: applying ? "apply" : "read-only", head, planSha256, posts: entries,
    publicListsUnchanged, publicLists: afterPublic,
    allPublicProjectionsUnchanged: publicListsUnchanged && entries.every((entry) => entry.languages?.every((locale) => locale.unchanged) ?? true) };
  if (!report.allPublicProjectionsUnchanged) throw new Error("Public projections would change; migration blocked.");
  if (applying) {
    if (expectedPlan !== planSha256) throw new Error("The migration plan changed since review; rerun the dry run.");
    const backup = join(root, ".cache", "blog-migration-backup", planSha256);
    await mkdir(backup, { recursive: true, mode: 0o700 });
    for (const conversion of conversions) {
      const existing = await readFile(join(folder, conversion.filename), "utf8");
      if (existing !== conversion.original) throw new Error(`Article changed during migration: ${conversion.filename}`);
      const backupFile = join(backup, conversion.filename);
      try { await writeFile(backupFile, conversion.original, { flag: "wx", mode: 0o600 }); }
      catch (error) {
        if (error.code !== "EEXIST" || await readFile(backupFile, "utf8") !== conversion.original) throw error;
      }
    }
    const temporary = await mkdtemp(join(folder, ".migration-"));
    try {
      for (const conversion of conversions) await writeFile(join(temporary, conversion.filename), conversion.proposed, { flag: "wx", mode: 0o600 });
      for (const conversion of conversions) await rename(join(temporary, conversion.filename), join(folder, conversion.filename));
    } finally { await rm(temporary, { recursive: true, force: true }); }
    report.backup = backup;
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Migration dry run blocked: ${error.message}\n`);
  process.exitCode = 1;
});
