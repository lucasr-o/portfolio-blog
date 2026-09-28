import styles from "./preview.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved blog previews", robots: { index: false, follow: false } };

export default function PreviewLayout({ children }) {
  return <div className={styles.shell}>
    <nav className={styles.navigation} aria-label="Editorial navigation">
      <a href="/keystatic">Blog editor</a><a href="/preview">Saved previews</a><a href="https://lucas-reis.com">Public website ↗</a>
    </nav>
    <main>{children}</main>
  </div>;
}
