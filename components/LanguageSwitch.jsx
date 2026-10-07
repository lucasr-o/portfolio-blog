import Link from "next/link";
import { blogCopy } from "@portfolio/blog-content/locale";
import styles from "./LanguageSwitch.module.css";

export default function LanguageSwitch({ locale = "en", englishHref, portugueseHref, index = false }) {
  if (!englishHref || !portugueseHref) return null;
  return <nav className={styles.switch} aria-label={index ? blogCopy(locale).indexLanguage : blogCopy(locale).language}>
    <Link href={englishHref} lang="en" hrefLang="en" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
    <Link href={portugueseHref} lang="pt-BR" hrefLang="pt-BR" aria-current={locale === "pt-BR" ? "page" : undefined}>PT</Link>
  </nav>;
}
