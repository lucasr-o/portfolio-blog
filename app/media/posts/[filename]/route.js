import { createHash } from "node:crypto";
import { getPublicContent } from "@/lib/public-content";
import { gifPoster, localMediaReader } from "@portfolio/blog-content/media";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const { media } = await getPublicContent();
  const filenames = [...new Set(Object.values(media).flatMap((image) =>
    [image.url, image.posterUrl].filter(Boolean).map((url) => url.split("/").at(-1))))];
  return filenames.length ? filenames.map((filename) => ({ filename })) : [{ filename: "__empty__" }];
}

export async function GET(_request, { params }) {
  const { filename } = await params;
  const { media } = await getPublicContent();
  const image = Object.values(media).find((image) => image.url === `/media/posts/${filename}` || image.posterUrl === `/media/posts/${filename}`);
  if (!image) return new Response(null, { status: 404 });
  const bytes = await localMediaReader(process.env.BLOG_CONTENT_ROOT || process.cwd())(image.repositoryPath);
  if (createHash("sha256").update(bytes).digest("hex") !== image.hash) throw new Error("Editorial image changed during rendering.");
  const output = image.posterUrl?.endsWith(`/${filename}`) ? await gifPoster(bytes) : bytes;
  if (createHash("sha256").update(output).digest("hex") !== (image.posterUrl?.endsWith(`/${filename}`) ? image.posterHash : image.hash)) {
    throw new Error("Editorial poster changed during rendering.");
  }
  return new Response(output, {
    headers: { "Content-Type": filename.endsWith(".jpg") ? "image/jpeg" : filename.endsWith(".png") ? "image/png" : filename.endsWith(".gif") ? "image/gif" : "image/webp" },
  });
}
