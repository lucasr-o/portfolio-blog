import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPostDate, getPostBySlug, posts } from "@/data/posts";
import { site } from "@/data/profile";
import { createBlogPostingSchema } from "@/lib/structured-data";
import styles from "./post.module.css";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
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
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd data={createBlogPostingSchema(post)} />
      <SiteHeader />
      <main id="main-content">
        <article className={styles.article}>
          <Link className={`${styles.back} touch-feedback`} href="/blog">← Back to blog</Link>
          <header className={styles.header}>
            <p className="eyebrow">Placeholder article</p>
            <h1>{post.title}</h1>
            <p className={styles.summary}>{post.summary}</p>
            <div className={styles.meta}><time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time><span aria-hidden="true">·</span><span>{post.readingTime}</span></div>
            <ul className={styles.tags} aria-label="Topics">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          </header>
          <div className={styles.body}>
            <p>{post.introduction}</p>
            {post.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
          </div>
          <p className={styles.author}>Written by {post.author}.</p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
