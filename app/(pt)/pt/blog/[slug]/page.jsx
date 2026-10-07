import { notFound } from "next/navigation";
import PublicArticle from "@/components/PublicArticle";
import { getPublicContent } from "@/lib/public-content";
import { articleMetadata, findPublicArticle } from "@/lib/blog-route";

export async function generateStaticParams() {
  const publication = await getPublicContent();
  return publication.ptPosts.length ? publication.ptPosts.map((post) => ({ slug: post.slug })) : [{ slug: "__empty__" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = findPublicArticle(await getPublicContent(), slug, "pt-BR");
  return post ? articleMetadata(post, true) : {};
}

export default async function PortuguesePostPage({ params }) {
  const { slug } = await params;
  const publication = await getPublicContent();
  const post = findPublicArticle(publication, slug, "pt-BR");
  if (!post) notFound();
  return <PublicArticle post={post} media={publication.media} hasPortuguese />;
}
