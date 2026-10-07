import Link from "next/link";
import { formatPostDate } from "@portfolio/blog-content/format";
import { articlePath, blogCopy } from "@portfolio/blog-content/locale";
import styles from "./PostPreview.module.css";

export default function PostPreview({ post, featured = false, variant = "card", headingLevel = 2 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const locale = post.locale ?? "en";
  const copy = blogCopy(locale);
  const className = [
    styles.card,
    featured ? styles.featured : null,
    variant === "minimal" ? styles.minimal : null,
  ].filter(Boolean).join(" ");

  return (
    <article className={className}>
      <div className={styles.overline}>
        {featured ? <span className={styles.latest}>{copy.latest}</span> : null}
        <div className={styles.meta}>
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, locale)}</time>
          <span aria-hidden="true">·</span><span>{post.readingTime}</span>
        </div>
      </div>
      <Heading className={styles.title}><Link href={articlePath(post, locale)}>{post.title}</Link></Heading>
      <p>{post.summary}</p>
      {post.tags.length > 0 && <ul className={styles.tags} aria-label={copy.topics}>{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
      <Link className={styles.readLink} href={articlePath(post, locale)}>{copy.readArticle} <span aria-hidden="true">→</span></Link>
    </article>
  );
}
