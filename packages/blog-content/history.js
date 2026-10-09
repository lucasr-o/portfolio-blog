import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ContentError, normalizeInstant, parsePostYaml } from "./model.js";

const run = promisify(execFile);
const MAX_GIT_OUTPUT = 2 * 1024 * 1024;

async function git(root, ...args) {
  const { stdout } = await run("git", ["-C", root, ...args], {
    encoding: "utf8", maxBuffer: MAX_GIT_OUTPUT,
  });
  return stdout.trimEnd();
}

function qualifying(post, locale) {
  if (post.status !== "published") return false;
  if (post.en !== undefined || post.createdAt !== undefined) {
    return post[locale]?.publish === true;
  }
  return locale === "en" || post.pt?.publish === true;
}

function publicFingerprint(post, locale) {
  const version = post.en !== undefined || post.createdAt !== undefined
    ? post[locale]
    : locale === "en" ? post : post.pt;
  return JSON.stringify({
    title: version?.title, summary: version?.summary, body: version?.body,
    tags: version?.tags, coverAlt: version?.coverAlt,
    author: post.author, cover: post.cover, images: post.images,
  });
}

function needsHistory(post) {
  if (post.en === undefined && post.createdAt === undefined) return false;
  if (post.status !== "published") return false;
  if (!post.createdAt) return true;
  return ["pt", "en"].some((locale) => qualifying(post, locale) && !post[locale]?.publishedAt);
}

function fail(slug, message) {
  return new ContentError([{ path: `content/posts/${slug}.yaml`, message }]);
}

async function resolveOne(root, post) {
  const file = `content/posts/${post.slug}.yaml`;
  let lines;
  try {
    lines = (await git(root, "log", "--first-parent", "--reverse", "--format=%H%x09%cI", "HEAD", "--", file))
      .split("\n").filter(Boolean);
  } catch {
    throw fail(post.slug, "Cannot inspect production Git history for automatic dates.");
  }
  if (!lines.length) {
    if (post.status === "draft") return post;
    throw fail(post.slug, "The published article has no committed Git history.");
  }

  const first = { pt: null, en: null };
  const latestEdit = { pt: null, en: null };
  const previousFingerprint = { pt: null, en: null };
  let createdAt = null;
  for (const line of lines) {
    const [revision, rawInstant] = line.split("\t");
    if (!/^[a-f0-9]{40}$/.test(revision)) throw fail(post.slug, "Invalid Git revision in article history.");
    let instant;
    try { instant = normalizeInstant(rawInstant); } catch { throw fail(post.slug, "Invalid Git committer date in article history."); }
    createdAt ??= instant;
    let historical;
    try {
      historical = parsePostYaml(await git(root, "show", `${revision}:${file}`), post.slug, `${file}@${revision}`);
    } catch {
      // Incomplete earlier drafts are not qualifying publications. The
      // current revision still undergoes normal content validation.
      continue;
    }
    for (const locale of ["pt", "en"]) {
      if (!qualifying(historical, locale)) continue;
      first[locale] ??= instant;
      const fingerprint = publicFingerprint(historical, locale);
      if (previousFingerprint[locale] !== null && fingerprint !== previousFingerprint[locale]) latestEdit[locale] = instant;
      previousFingerprint[locale] = fingerprint;
    }
  }

  const resolved = { ...post, createdAt: post.createdAt ?? createdAt };
  for (const locale of ["pt", "en"]) {
    if (!post[locale]) continue;
    const version = { ...post[locale] };
    if (qualifying(post, locale) && !version.publishedAt) {
      if (!first[locale]) throw fail(post.slug, `No qualifying committed ${locale} publication was found; release is blocked.`);
      version.publishedAt = first[locale];
    }
    if (qualifying(post, locale) && !version.updatedAt && latestEdit[locale] && latestEdit[locale] > version.publishedAt) {
      version.updatedAt = latestEdit[locale];
    }
    resolved[locale] = version;
  }
  return resolved;
}

export async function resolveCommitDates(root, posts) {
  if (!posts.some(needsHistory)) return posts;
  let shallow;
  try { shallow = await git(root, "rev-parse", "--is-shallow-repository"); }
  catch { throw new ContentError([{ path: "content/posts", message: "A full Git history is required for automatic dates." }]); }
  if (shallow !== "false") throw new ContentError([{ path: "content/posts", message: "A shallow Git checkout cannot determine first-publication dates." }]);
  return Promise.all(posts.map((post) => needsHistory(post) ? resolveOne(root, post) : post));
}
