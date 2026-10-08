import BlogIndex from "@/components/BlogIndex";
import { getPublicContent } from "@/lib/public-content";
import { pageCount, postsOnPage } from "@portfolio/blog-content/pagination";

export const metadata = {
  title: "Blog em português",
  description: "Artigos de Lucas Reis sobre segurança, tecnologia e outros assuntos.",
  alternates: { canonical: "/pt/blog/", languages: { en: "/blog/", "pt-BR": "/pt/blog/" } },
  openGraph: {
    title: "Artigos | Lucas Reis",
    description: "Artigos sobre segurança, tecnologia e outros assuntos.",
    url: "/pt/blog/", type: "website", locale: "pt_BR",
  },
};

export default async function PortugueseBlogPage() {
  const { ptPosts } = await getPublicContent();
  return <BlogIndex posts={postsOnPage(ptPosts, 1)} totalPosts={ptPosts.length} totalPages={pageCount(ptPosts.length)} locale="pt-BR" />;
}
