import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import styles from "./article.module.css";

export function safeLink(value) {
  // Do not allow protocol-relative URLs, encoded control characters or executables.
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) return "";
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (value.startsWith("#") || /^\/(?!\/)/.test(value)) return value;
  return "";
}

export default function Markdown({ body, media = {} }) {
  return <div className={styles.body}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: false }]]}
      skipHtml
      urlTransform={(value, key) => key === "src" ? (Object.hasOwn(media, value) ? value : "") : safeLink(value)}
      components={{
        h1: ({ children }) => <h2>{children}</h2>,
        a: ({ href, children }) => href ? <a href={href}>{children}</a> : <span>{children}</span>,
        table: ({ children }) => <div className={styles.tableScroll} role="region" aria-label="Article table" tabIndex={0}><table>{children}</table></div>,
        img: ({ src, alt }) => {
          const image = media[src];
          if (!image) return null;
          // Trusted build/preview manifest supplies the URL and intrinsic dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          return <img className={styles.image} src={image.url} alt={alt || image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />;
        },
      }}
    >{body}</ReactMarkdown>
  </div>;
}
