import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./interactive-hover-button.module.css";

export function InteractiveHoverButton({
  text = "Button",
  href,
  className = "",
  ...props
}) {
  const classes = [styles.root, className].filter(Boolean).join(" ");
  const content = (
    <>
      <span className={styles.restingText}>{text}</span>
      <span className={styles.hoverContent} aria-hidden="true">
        <span>{text}</span>
        <ArrowRight className={styles.icon} aria-hidden="true" strokeWidth={2} />
      </span>
      <span className={styles.accent} aria-hidden="true" />
    </>
  );

  if (href) {
    return (
      <Link className={classes} href={href} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {content}
    </button>
  );
}
