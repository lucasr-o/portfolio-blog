export const IMAGE_NAME = "ghcr.io/lucasr-o/portfolio-blog-cms";
export const DIGEST_IMAGE = /^ghcr\.io\/lucasr-o\/portfolio-blog-cms@sha256:[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;

export async function updateCms({ currentImage, candidateImage, failedImage = null,
  readMainHead, pull, inspect, apply, healthy, rememberFailure }) {
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
      "https://github.com/lucasr-o/portfolio-blog" || metadata.revision !== head) {
    throw new Error("Candidate image architecture, source or main revision is not approved");
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
