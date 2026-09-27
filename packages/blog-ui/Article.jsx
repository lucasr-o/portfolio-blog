import React from "react";
import { formatPostDate } from "@portfolio/blog-content/format";
import Markdown from "./Markdown.jsx";
import styles from "./article.module.css";

export default function Article({ post, media = {}, backLink }) {
  const cover = post.cover && media[post.cover.src];
  return <article className={styles.article}>
    {backLink && <div className={styles.back}>{backLink}</div>}
    <header className={styles.header}>
      {post.isPlaceholder && <p className="eyebrow">Placeholder article</p>}
      <h1>{post.title || "Untitled draft"}</h1>
      {post.summary && <p className={styles.summary}>{post.summary}</p>}
      <div className={styles.meta}>
        {post.publishedAt && <><time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time><span aria-hidden="true">·</span></>}
        <span>{post.readingTime}</span>
      </div>
      {post.tags.length > 0 && <ul className={styles.tags} aria-label="Topics">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
    </header>
    {cover && <div className={styles.cover}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.image} src={cover.url} alt={post.cover.alt} width={cover.width} height={cover.height} />
    </div>}
    <Markdown body={post.body} media={media} />
    <p className={styles.author}>Written by {post.author}.</p>
  </article>;
}
