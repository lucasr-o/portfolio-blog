import BlogIndex from "@/components/BlogIndex";
import { getPublicContent } from "@/lib/public-content";

export const metadata = {
  title: "Blog",
  description: "Application security notes on threat modeling, penetration testing, and secure product delivery by Lucas Reis.",
  alternates: { canonical: "/blog/", languages: { en: "/blog/", "pt-BR": "/pt/blog/" } },
  openGraph: {
    title: "Application security notes | Lucas Reis",
    description: "Practical notes from application-security work.",
    url: "/blog/",
    type: "website",
    locale: "en_US",
  },
};

export default async function BlogPage() {
  const { posts } = await getPublicContent();
  return <BlogIndex posts={posts} />;
}
