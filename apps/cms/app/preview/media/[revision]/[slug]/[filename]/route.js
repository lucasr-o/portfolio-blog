import { ContentError } from "@portfolio/blog-content/model";
import { PREVIEW_HEADERS, PreviewError, readPreviewImage } from "../../../../../../lib/github-preview.js";
import { previewSession } from "../../../../../../lib/preview-session.js";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { revision, slug, filename } = await params;
    const bytes = await readPreviewImage(await previewSession(revision), slug, filename);
    return new Response(bytes, { headers: { ...PREVIEW_HEADERS, "Content-Type": filename.endsWith(".jpg") ? "image/jpeg" : filename.endsWith(".png") ? "image/png" : filename.endsWith(".gif") ? "image/gif" : "image/webp" } });
  } catch (error) {
    return Response.json({ error: error instanceof PreviewError || error instanceof ContentError ? error.message : "Preview image unavailable." }, { status: error instanceof PreviewError ? error.status : error instanceof ContentError ? 422 : 502, headers: PREVIEW_HEADERS });
  }
}
