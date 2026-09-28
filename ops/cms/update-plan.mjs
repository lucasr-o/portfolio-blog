export const IMAGE_NAME = "ghcr.io/lucasr-o/portfolio-blog-cms";
export const DIGEST_IMAGE = /^ghcr\.io\/lucasr-o\/portfolio-blog-cms@sha256:[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;
const IMAGE_INPUTS = ["apps/cms/", "packages/blog-content/", "packages/blog-ui/",
  "ops/cms/Dockerfile", ".dockerignore", "package.json", "pnpm-lock.yaml",
  "pnpm-workspace.yaml", ".github/workflows/cms-image.yml"];

const affectsImage = (name) => typeof name !== "string" ||
  IMAGE_INPUTS.some((input) => input.endsWith("/") ? name.startsWith(input) : name === input);

// GitHub's compare endpoint lists at most 300 changed files. An incomplete
// list cannot establish that no image input changed, so reject it.
export function imageRevisionStillCurrent({ candidateRevision, mainHead, comparison }) {
  if (!REVISION.test(candidateRevision ?? "") || !REVISION.test(mainHead ?? "")) return false;
  if (candidateRevision === mainHead) return true;
  return comparison?.status === "ahead" && comparison.behind_by === 0 &&
    Number.isSafeInteger(comparison.ahead_by) && comparison.ahead_by > 0 &&
    comparison.base_commit?.sha === candidateRevision &&
    Array.isArray(comparison.files) && comparison.files.length < 300 &&
    comparison.files.every((file) => !affectsImage(file.filename) &&
      (!file.previous_filename || !affectsImage(file.previous_filename)));
}

export async function updateCms({ currentImage, candidateImage, failedImage = null,
  readMainHead, compareRevisions, pull, inspect, apply, healthy, rememberFailure }) {
  if (!DIGEST_IMAGE.test(currentImage ?? "") || !DIGEST_IMAGE.test(candidateImage ?? "")) {
    throw new Error("CMS updater accepts only this project's image by digest");
  }
  if (candidateImage === currentImage) return { status: "unchanged", image: currentImage };
  if (candidateImage === failedImage) return { status: "previously-failed", image: currentImage };
  const head = await readMainHead();
  if (!REVISION.test(head ?? "")) throw new Error("Invalid main branch revision");
  await pull(candidateImage);
  const metadata = await inspect(candidateImage);
  if (metadata.architecture !== "arm64" || metadata.source !==
      "https://github.com/lucasr-o/portfolio-blog" || !REVISION.test(metadata.revision ?? "")) {
    throw new Error("Candidate image architecture, source or revision is not approved");
  }
  const comparison = metadata.revision === head ? null :
    await compareRevisions(metadata.revision, head);
  if (!imageRevisionStillCurrent({ candidateRevision: metadata.revision,
    mainHead: head, comparison })) {
    throw new Error("CMS image is not the latest approved build for main");
  }
  if (await readMainHead() !== head) throw new Error("Main changed while checking candidate image");
  let applying = false;
  try {
    applying = true;
    await apply(candidateImage);
    if (!await healthy()) throw new Error("New CMS image did not become healthy");
    return { status: "updated", image: candidateImage, revision: head };
  } catch (error) {
    if (!applying) throw error;
    let recordError = null;
    try { await rememberFailure(candidateImage); } catch (failure) { recordError = failure; }
    try {
      await apply(currentImage);
      if (!await healthy()) throw new Error("Previous CMS image did not recover");
      throw new Error(`CMS update failed and previous image was restored: ${error.message}${recordError ? "; failure record could not be saved" : ""}`);
    } catch (recoveryError) {
      if (recoveryError.message.startsWith("CMS update failed and previous image was restored:")) throw recoveryError;
      throw new AggregateError([error, recoveryError], "CMS update and recovery both failed");
    }
  }
}
