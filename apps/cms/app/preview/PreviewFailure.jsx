import { ContentError } from "@portfolio/blog-content/model";
import { PreviewError } from "../../lib/github-preview.js";
import styles from "./preview.module.css";

export default function PreviewFailure({ error }) {
  const message = error instanceof ContentError || error instanceof PreviewError ? error.message : "The preview is unavailable. Retry shortly; your saved content has not been changed.";
  return <section className={styles.panel}><h1>Preview unavailable</h1><p role="alert">{message}</p><p><a href="/keystatic">Open the editor and sign in again</a></p></section>;
}
