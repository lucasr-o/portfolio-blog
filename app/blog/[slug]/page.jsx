import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/public-content";
import Article from "@portfolio/blog-ui/Article";
import { site } from "@/data/profile";
import { createBlogPostingSchema } from "@/lib/structured-data";

export async function generateStaticParams() {
  const { posts } = await getPublicContent();
  // Next 16.3 requires at least one dynamic parameter for output: export.
  // This non-editorial slug resolves to notFound() and must emit no public files.
  return posts.length ? posts.map((post) => ({ slug: post.slug })) : [{ slug: "__empty__" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { posts } = await getPublicContent();
  const post = posts.find((post) => post.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    authors: [{ name: post.author, url: site.url }],
    alternates: { canonical: `/blog/${post.slug}/` },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `/blog/${post.slug}/`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const { posts, media } = await getPublicContent();
  const post = posts.find((post) => post.slug === slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd data={createBlogPostingSchema(post)} />
      <SiteHeader />
      <main id="main-content">
        <Article post={post} media={media} backLink={<Link className="touch-feedback" href="/blog">← Back to blog</Link>} />
      </main>
      <SiteFooter />
    </>
  );
}
