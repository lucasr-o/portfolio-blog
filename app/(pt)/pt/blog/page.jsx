import BlogIndex from "@/components/BlogIndex";
import { getPublicContent } from "@/lib/public-content";

export const metadata = {
  title: "Blog em português",
  description: "Notas de Lucas Reis sobre segurança de aplicações, modelagem de ameaças e testes de segurança.",
  alternates: { canonical: "/pt/blog/", languages: { en: "/blog/", "pt-BR": "/pt/blog/" } },
  openGraph: {
    title: "Notas sobre segurança de aplicações | Lucas Reis",
    description: "Notas práticas sobre segurança de aplicações.",
    url: "/pt/blog/", type: "website", locale: "pt_BR",
  },
};

export default async function PortugueseBlogPage() {
  const { ptPosts } = await getPublicContent();
  return <BlogIndex posts={ptPosts} locale="pt-BR" />;
}
