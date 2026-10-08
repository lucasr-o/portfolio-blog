import BlogIndex from "@/components/BlogIndex";
import { getPublicContent } from "@/lib/public-content";
import { pageCount, postsOnPage } from "@portfolio/blog-content/pagination";

export const metadata = {
  title: "Blog",
  description: "Posts by Lucas Reis about security, technology, and more.",
  alternates: { canonical: "/blog/", languages: { en: "/blog/", "pt-BR": "/pt/blog/" } },
  openGraph: {
    title: "Posts | Lucas Reis",
    description: "Posts about security, technology, and more.",
    url: "/blog/",
    type: "website",
    locale: "en_US",
  },
};

export default async function BlogPage() {
  const { posts } = await getPublicContent();
  return <BlogIndex posts={postsOnPage(posts, 1)} totalPosts={posts.length} totalPages={pageCount(posts.length)} />;
}
