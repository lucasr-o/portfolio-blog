import Link from "next/link";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p>© {new Date().getUTCFullYear()} Lucas Reis</p>
        <nav aria-label="Footer navigation">
          <Link className="touch-feedback" href="/">Portfolio</Link>
          <Link className="touch-feedback" href="/blog">Blog</Link>
        </nav>
      </div>
    </footer>
  );
}
