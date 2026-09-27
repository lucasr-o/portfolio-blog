import PostPreview from "@/components/PostPreview";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/public-content";
import styles from "./blog.module.css";

export const metadata = {
  title: "Blog",
  description: "Application security notes on threat modeling, penetration testing, and secure product delivery by Lucas Reis.",
  alternates: { canonical: "/blog/" },
  openGraph: {
    title: "Application security notes | Lucas Reis",
    description: "Practical notes from application-security work.",
    url: "/blog/",
    type: "website",
  },
};

export default async function BlogPage() {
  const { posts: sortedPosts } = await getPublicContent();
  const articleCount = `${sortedPosts.length} ${sortedPosts.length === 1 ? "article" : "articles"}`;

  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.main}`} id="main-content">
        <header className={`${styles.header} reveal-on-load`}>
          <div>
            <p className="eyebrow">Writing</p>
            <h1>Application security notes.</h1>
          </div>
          <p>Practical observations about finding risk, explaining it clearly, and helping product teams ship safer systems.</p>
        </header>
        <section className={styles.archive} aria-labelledby="articles-title">
          <div className={`${styles.archiveHeader} reveal-on-scroll`}>
            <h2 id="articles-title">Latest notes</h2>
            <p>{articleCount}</p>
          </div>
          {sortedPosts.length === 0 ? <p>No articles yet. New notes will appear here.</p> : <ol className={styles.list}>
            {sortedPosts.map((post, index) => (
              <li className="reveal-on-scroll" key={post.slug}>
                <PostPreview post={post} featured={index === 0} variant="minimal" headingLevel={3} />
              </li>
            ))}
          </ol>}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
