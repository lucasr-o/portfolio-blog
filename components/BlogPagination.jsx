import Link from "next/link";
import { blogPagePath, paginationItems } from "@portfolio/blog-content/pagination";
import { searchHref } from "@portfolio/blog-content/search";
import styles from "./BlogPagination.module.css";

export default function BlogPagination({ locale = "en", currentPage = 1, totalPages = 1, query = "" }) {
  if (totalPages < 2) return null;
  const portuguese = locale === "pt-BR";
  const href = (page) => query ? searchHref(locale, query, page) : blogPagePath(locale, page);
  const PageLink = query ? "a" : Link;
  return <nav className={styles.nav} aria-label={portuguese ? "Páginas dos artigos" : "Post pages"}>
    {currentPage > 1 && <PageLink className={styles.previous} href={href(currentPage - 1)} rel="prev">
      <span aria-hidden="true">←</span> {portuguese ? "Anterior" : "Previous"}</PageLink>}
    <ol className={styles.pages}>{paginationItems(currentPage, totalPages).map((item, index) =>
      <li key={`${item}-${index}`}>{item === "ellipsis" ? <span className={styles.ellipsis} aria-hidden="true">…</span> :
        <PageLink className={styles.page} href={href(item)} aria-label={portuguese ? `Página ${item}` : `Page ${item}`}
          aria-current={item === currentPage ? "page" : undefined}>{item}</PageLink>}</li>)}</ol>
    {currentPage < totalPages && <PageLink className={styles.next} href={href(currentPage + 1)} rel="next">
      {portuguese ? "Próxima" : "Next"} <span aria-hidden="true">→</span></PageLink>}
  </nav>;
}
