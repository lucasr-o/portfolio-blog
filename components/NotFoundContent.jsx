import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import styles from "@/app/not-found.module.css";

export default function NotFoundContent({ locale = "en" }) {
  const portuguese = locale === "pt-BR";
  return (
    <>
      <SiteHeader />
      <main className={`container ${styles.main}`} id="main-content">
        <div className={styles.content}>
          <p className={styles.code} aria-hidden="true">404</p>
          <div className={styles.message}>
            <p className="eyebrow">Error 404</p>
            <h1>{portuguese ? "Não encontramos essa página." : "We couldn’t find that page."}</h1>
            <p className={styles.description}>
              {portuguese ? "O link pode estar desatualizado ou a página pode ter mudado. Volte ao portfólio ou explore o blog." : "The link may be outdated, or the page may have moved. You can head back to the portfolio or explore the blog."}
            </p>
            <div className={styles.actions}>
              <Link className={`${styles.primaryLink} touch-feedback`} href="/">{portuguese ? "Voltar ao início" : "Back to home"}</Link>
              <Link className={`${styles.secondaryLink} touch-feedback`} href={portuguese ? "/pt/blog/" : "/blog/"}>{portuguese ? "Explorar o blog" : "Browse the blog"}</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
