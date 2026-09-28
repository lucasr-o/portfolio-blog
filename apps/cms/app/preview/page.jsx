import { previewSession } from "../../lib/preview-session.js";
import PreviewFailure from "./PreviewFailure.jsx";
import styles from "./preview.module.css";

export default async function PreviewIndex() {
  let snapshot;
  try { snapshot = await previewSession(); }
  catch (error) { return <PreviewFailure error={error} />; }
  return <section className={styles.panel}>
    <h1>Saved previews</h1>
    <p>Latest saved articles from <strong>main</strong>. Save in the editor, then reload this page. Unsaved edits are not shown.</p>
    <p>Revision: <code>{snapshot.revision}</code></p>
    <p>Drafts are excluded from the website, but their source is readable in the public GitHub repository.</p>
    {snapshot.slugs.length ? <ul>{snapshot.slugs.map((slug) => <li key={slug}><a href={`/preview/${slug}`}>{slug}</a></li>)}</ul> : <p>No saved articles yet.</p>}
  </section>;
}
