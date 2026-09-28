import { cookies } from "next/headers";
import { openGitHubSnapshot } from "./github-preview.js";

export async function previewSession(revision) {
  const token = (await cookies()).get("keystatic-gh-access-token")?.value;
  return openGitHubSnapshot(token, { revision });
}
