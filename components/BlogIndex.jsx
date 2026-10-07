import PostPreview from "@/components/PostPreview";
import LanguageSwitch from "@/components/LanguageSwitch";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { blogCopy } from "@portfolio/blog-content/locale";
import styles from "./BlogIndex.module.css";

export default function BlogIndex({ posts, locale = "en" }) {
  const copy = blogCopy(locale);
  const articleCount = `${posts.length} ${posts.length === 1 ? copy.articleSingular : copy.articlePlural}`;

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
      <section className={styles.archive} aria-labelledby="articles-title">
        <div className={`${styles.archiveHeader} reveal-on-scroll`}>
          <h2 id="articles-title">{copy.latestNotes}</h2>
          <p>{articleCount}</p>
        </div>
        {posts.length === 0 ? <p>{copy.empty}</p> : <ol className={styles.list}>
          {posts.map((post, index) => <li className="reveal-on-scroll" key={post.slug}>
            <PostPreview post={post} featured={index === 0} variant="minimal" headingLevel={3} />
          </li>)}
        </ol>}
      </section>
    </main>
    <SiteFooter />
  </>;
}
