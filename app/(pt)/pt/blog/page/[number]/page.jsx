import { notFound } from "next/navigation";
import BlogIndex from "@/components/BlogIndex";
import { getPublicContent } from "@/lib/public-content";
import { blogPagePath, pageCount, parseArchivePage, postsOnPage } from "@portfolio/blog-content/pagination";

export async function generateStaticParams() {
  const { ptPosts } = await getPublicContent();
  return pageCount(ptPosts.length) > 1 ? Array.from({ length: pageCount(ptPosts.length) - 1 }, (_, index) =>
    ({ number: String(index + 2) })) : [{ number: "__empty__" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { number } = await params;
  const { ptPosts } = await getPublicContent();
  const page = parseArchivePage(number, pageCount(ptPosts.length));
  if (!page) return {};
  const path = blogPagePath("pt-BR", page);
  return { title: `Artigos — página ${page}`, description: `Explore a página ${page} dos artigos de Lucas Reis sobre segurança, tecnologia e outros assuntos.`,
    alternates: { canonical: path }, openGraph: { title: `Artigos — página ${page} | Lucas Reis`,
      description: `Explore a página ${page} dos artigos de Lucas Reis.`, url: path, type: "website", locale: "pt_BR" } };
}

export default async function PortugueseBlogNumberedPage({ params }) {
  const { number } = await params;
  const { ptPosts } = await getPublicContent();
  const totalPages = pageCount(ptPosts.length);
  const page = parseArchivePage(number, totalPages);
  if (!page) notFound();
  return <BlogIndex posts={postsOnPage(ptPosts, page)} totalPosts={ptPosts.length} totalPages={totalPages} currentPage={page} locale="pt-BR" />;
}
