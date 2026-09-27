import { createHash } from "node:crypto";
import { getPublicContent } from "@/lib/public-content";
import { localMediaReader } from "@portfolio/blog-content/media";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const { media } = await getPublicContent();
  const filenames = [...new Set(Object.values(media).map((image) => image.url.split("/").at(-1)))];
  return filenames.length ? filenames.map((filename) => ({ filename })) : [{ filename: "__empty__" }];
}

export async function GET(_request, { params }) {
  const { filename } = await params;
  const { media } = await getPublicContent();
  const image = Object.values(media).find((image) => image.url === `/media/posts/${filename}`);
  if (!image) return new Response(null, { status: 404 });
  const bytes = await localMediaReader(process.env.BLOG_CONTENT_ROOT || process.cwd())(image.repositoryPath);
  if (createHash("sha256").update(bytes).digest("hex") !== image.hash) throw new Error("Editorial image changed during rendering.");
  return new Response(bytes, {
    headers: { "Content-Type": filename.endsWith(".jpg") ? "image/jpeg" : filename.endsWith(".png") ? "image/png" : "image/webp" },
  });
}
