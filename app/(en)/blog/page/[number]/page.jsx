import { notFound } from "next/navigation";
import BlogIndex from "@/components/BlogIndex";
import { getPublicContent } from "@/lib/public-content";
import { blogPagePath, pageCount, parseArchivePage, postsOnPage } from "@portfolio/blog-content/pagination";

export async function generateStaticParams() {
  const { posts } = await getPublicContent();
  return pageCount(posts.length) > 1 ? Array.from({ length: pageCount(posts.length) - 1 }, (_, index) =>
    ({ number: String(index + 2) })) : [{ number: "__empty__" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { number } = await params;
  const { posts } = await getPublicContent();
  const page = parseArchivePage(number, pageCount(posts.length));
  if (!page) return {};
  const path = blogPagePath("en", page);
  return { title: `Posts — page ${page}`, description: `Explore page ${page} of Lucas Reis's posts on security, technology and more.`,
    alternates: { canonical: path }, openGraph: { title: `Posts — page ${page} | Lucas Reis`,
      description: `Explore page ${page} of Lucas Reis's posts.`, url: path, type: "website", locale: "en_US" } };
}

export default async function BlogNumberedPage({ params }) {
  const { number } = await params;
  const { posts } = await getPublicContent();
  const totalPages = pageCount(posts.length);
  const page = parseArchivePage(number, totalPages);
  if (!page) notFound();
  return <BlogIndex posts={postsOnPage(posts, page)} totalPosts={posts.length} totalPages={totalPages} currentPage={page} />;
}
