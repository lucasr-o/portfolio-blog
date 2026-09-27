import styles from "./BackgroundGrid.module.css";

export default function BackgroundGrid() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.glow} />
    </div>
  );
}
