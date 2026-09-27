import Link from "next/link";
import { formatPostDate } from "@portfolio/blog-content/format";
import styles from "./PostPreview.module.css";

export default function PostPreview({ post, featured = false, variant = "card", headingLevel = 2 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const className = [
    styles.card,
    featured ? styles.featured : null,
    variant === "minimal" ? styles.minimal : null,
  ].filter(Boolean).join(" ");

  return (
    <article className={className}>
      <div className={styles.overline}>
        {featured ? <span className={styles.latest}>Latest</span> : null}
        <div className={styles.meta}>
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span><span>{post.readingTime}</span>
        </div>
      </div>
      <Heading className={styles.title}><Link href={`/blog/${post.slug}`}>{post.title}</Link></Heading>
      <p>{post.summary}</p>
      <ul className={styles.tags} aria-label="Topics">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      <Link className={styles.readLink} href={`/blog/${post.slug}`}>Read article <span aria-hidden="true">→</span></Link>
    </article>
  );
}
