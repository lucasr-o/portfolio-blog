import { notFound } from "next/navigation";
import PublicArticle from "@/components/PublicArticle";
import { getPublicContent } from "@/lib/public-content";
import { articleMetadata, findPublicArticle } from "@/lib/blog-route";

export async function generateStaticParams() {
  const { posts } = await getPublicContent();
  // Next 16.3 requires at least one dynamic parameter for output: export.
  // This non-editorial slug resolves to notFound() and must emit no public files.
  return posts.length ? posts.map((post) => ({ slug: post.slug })) : [{ slug: "__empty__" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const publication = await getPublicContent();
  const post = findPublicArticle(publication, slug);
  if (!post) return {};
  return articleMetadata(post, Boolean(findPublicArticle(publication, slug, "pt-BR")));
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const publication = await getPublicContent();
  const post = findPublicArticle(publication, slug);
  if (!post) notFound();
  return <PublicArticle post={post} media={publication.media} hasCounterpart={Boolean(findPublicArticle(publication, slug, "pt-BR"))} />;
}
