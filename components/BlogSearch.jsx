"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { blogPath } from "@portfolio/blog-content/locale";
import { pageCount, postsOnPage } from "@portfolio/blog-content/pagination";
import { MAX_SEARCH_LENGTH, normalizeSearchQuery, searchPage, searchPosts } from "@portfolio/blog-content/search";
import PostPreview from "@/components/PostPreview";
import BlogPagination from "@/components/BlogPagination";
import styles from "./BlogSearch.module.css";

const indexPaths = { en: "/blog-search/en.json", "pt-BR": "/blog-search/pt-BR.json" };

export default function BlogSearch({ locale = "en" }) {
  const portuguese = locale === "pt-BR";
  const input = useRef(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [matches, setMatches] = useState([]);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const nextQuery = window.location.pathname === blogPath(locale) ? normalizeSearchQuery(parameters.get("q")) : "";
    if (input.current) input.current.value = nextQuery;
    if (!nextQuery) {
      document.documentElement.removeAttribute("data-blog-search");
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setQuery(nextQuery);
      setStatus("loading");
    });
    fetch(indexPaths[locale], { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") ?? "").includes("application/json")) {
          throw new Error("Search index unavailable");
        }
        return response.json();
      })
      .then((index) => {
        if (index.locale !== locale) throw new Error("Search locale mismatch");
        const results = searchPosts(index, nextQuery);
        if (!cancelled) {
          setMatches(results);
          setPage(searchPage(parameters.get("page"), results.length));
          setStatus("ready");
        }
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [locale, attempt]);

  const active = status !== "idle";
  return <>
    <form className={styles.form} action={blogPath(locale)} method="get" role="search">
      <label htmlFor={`blog-query-${locale}`}>{portuguese ? "Pesquisar nos artigos" : "Search posts"}</label>
      <div className={styles.field}>
        <Search size={19} aria-hidden="true" />
        <input ref={input} id={`blog-query-${locale}`} name="q" type="search" maxLength={MAX_SEARCH_LENGTH}
          placeholder={portuguese ? "Uma palavra ou assunto…" : "A word or topic…"} autoComplete="off" />
        <button className={styles.submit} type="submit">{portuguese ? "Pesquisar" : "Search"}</button>
      </div>
    </form>
    <section className={styles.results} aria-label={portuguese ? "Resultados da pesquisa" : "Search results"}
      hidden={!active} aria-live="polite">
      {active && <>
        <div className={styles.resultHeader}>
          <p>{status === "loading" ? (portuguese ? "Pesquisando…" : "Searching…") :
            status === "error" ? (portuguese ? "A pesquisa não carregou." : "Search could not load.") :
              `${matches.length} ${matches.length === 1 ? (portuguese ? "resultado" : "result") : (portuguese ? "resultados" : "results")} ${portuguese ? "para" : "for"} “${query}”`}</p>
          <a className={styles.clear} href={blogPath(locale)} aria-label={portuguese ? "Limpar pesquisa" : "Clear search"}>
            <X size={16} aria-hidden="true" /> {portuguese ? "Limpar" : "Clear"}</a>
        </div>
        {status === "error" && <button className={styles.retry} type="button" onClick={() => setAttempt((value) => value + 1)}>
          {portuguese ? "Tentar novamente" : "Try again"}</button>}
        {status === "ready" && matches.length === 0 && <p className={styles.empty}>
          {portuguese ? "Nenhum artigo encontrado. Tente outras palavras." : "No posts found. Try different keywords."}</p>}
        {status === "ready" && matches.length > 0 && <>
          <ol className={styles.list}>{postsOnPage(matches, page).map((post) => <li key={post.slug}>
            <PostPreview post={post} variant="minimal" headingLevel={3} /></li>)}</ol>
          <BlogPagination locale={locale} currentPage={page} totalPages={pageCount(matches.length)} query={query} />
        </>}
      </>}
    </section>
    <p className={styles.initialStatus} role="status">{portuguese ? "Pesquisando…" : "Searching…"}</p>
  </>;
}
