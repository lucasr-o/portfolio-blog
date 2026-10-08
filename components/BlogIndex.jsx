import PostPreview from "@/components/PostPreview";
import LanguageSwitch from "@/components/LanguageSwitch";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import BlogPagination from "@/components/BlogPagination";
import BlogSearch from "@/components/BlogSearch";
import { blogCopy } from "@portfolio/blog-content/locale";
import styles from "./BlogIndex.module.css";

export default function BlogIndex({ posts, totalPosts = posts.length, totalPages = 1, currentPage = 1, locale = "en" }) {
  const copy = blogCopy(locale);
  const articleCount = `${totalPosts} ${totalPosts === 1 ? copy.articleSingular : copy.articlePlural}`;

  return <>
    <SiteHeader />
    <main className={`container ${styles.main}`} id="main-content">
      <header className={`${styles.header} reveal-on-load`}>
        <div>
          <p className="eyebrow">{copy.writing}</p>
          <h1>{copy.blogTitle}</h1>
          <LanguageSwitch locale={locale} englishHref="/blog/" portugueseHref="/pt/blog/" index />
        </div>
        <p>{copy.blogIntroduction}</p>
      </header>
      <BlogSearch locale={locale} />
      <section className={`${styles.archive} ${styles.archiveBase}`} aria-labelledby="articles-title">
        <div className={`${styles.archiveHeader} reveal-on-scroll`}>
          <h2 id="articles-title">{copy.latestNotes}</h2>
          <p>{articleCount}</p>
        </div>
        {posts.length === 0 ? <p>{copy.empty}</p> : <ol className={styles.list}>
          {posts.map((post, index) => <li className="reveal-on-scroll" key={post.slug}>
            <PostPreview post={post} featured={currentPage === 1 && index === 0} variant="minimal" headingLevel={3} />
          </li>)}
        </ol>}
        <BlogPagination locale={locale} currentPage={currentPage} totalPages={totalPages} />
      </section>
    </main>
    <SiteFooter />
  </>;
}
