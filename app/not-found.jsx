import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import styles from "./not-found.module.css";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.main}`} id="main-content">
        <div className={styles.content}>
          <p className={styles.code} aria-hidden="true">404</p>
          <div className={styles.message}>
            <p className="eyebrow">Error 404</p>
            <h1>We couldn’t find that page.</h1>
            <p className={styles.description}>
              The link may be outdated, or the page may have moved. You can head back to the portfolio or explore the blog.
            </p>
            <div className={styles.actions}>
              <Link className={`${styles.primaryLink} touch-feedback`} href="/">Back to home</Link>
              <Link className={`${styles.secondaryLink} touch-feedback`} href="/blog/">Browse the blog</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
