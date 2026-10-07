import React from "react";
import { formatPostDate } from "@portfolio/blog-content/format";
import { blogCopy } from "@portfolio/blog-content/locale";
import Markdown from "./Markdown.jsx";
import styles from "./article.module.css";

export default function Article({ post, media = {}, backLink, languageSwitch }) {
  const cover = post.cover && media[post.cover.src];
  const locale = post.locale ?? "en";
  const copy = blogCopy(locale);
  return <article className={styles.article} lang={locale}>
    {(backLink || languageSwitch) && <div className={styles.back}>{backLink}{languageSwitch}</div>}
    <header className={styles.header}>
      {post.isPlaceholder && <p className="eyebrow">{copy.placeholder}</p>}
      <h1>{post.title || copy.untitled}</h1>
      {post.summary && <p className={styles.summary}>{post.summary}</p>}
      <div className={styles.meta}>
        {post.publishedAt && <><time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, locale)}</time><span aria-hidden="true">·</span></>}
        <span>{post.readingTime}</span>
      </div>
      {post.tags.length > 0 && <ul className={styles.tags} aria-label={copy.topics}>{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
    </header>
    {cover && <div className={styles.cover}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.image} src={cover.url} alt={post.cover.alt} width={cover.width} height={cover.height} />
    </div>}
    <Markdown body={post.body} media={media} locale={locale} />
    <p className={styles.author}>{copy.writtenBy} {post.author}.</p>
  </article>;
}
