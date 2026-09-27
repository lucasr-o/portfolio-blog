import Image from "next/image";
import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import styles from "./SiteHeader.module.css";

const navigation = [
  { label: "Work", href: "/#work" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/#about" },
];

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link className={styles.brand} href="/#main-content" aria-label="lucas-reis — home">
          <Image
            className={styles.brandLogo}
            src="/lucas-reis-logo.svg"
            alt=""
            width={32}
            height={32}
            aria-hidden="true"
          />
          <span>lucas-reis</span>
        </Link>
        <nav className={styles.navigation} aria-label="Primary navigation">
          <div className={styles.primaryLinks}>
            {navigation.map((item, index) => (
              <span className={styles.navItem} key={item.label}>
                <Link className="touch-feedback" href={item.href}>{item.label}</Link>
                {index < navigation.length - 1 ? <span className={styles.separator} aria-hidden="true">/</span> : null}
              </span>
            ))}
          </div>
          <InteractiveHoverButton href="/#contact" text="Contact" />
        </nav>
      </div>
    </header>
  );
}
