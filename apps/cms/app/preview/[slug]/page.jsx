import Article from "@portfolio/blog-ui/Article";
import { blogPath } from "@portfolio/blog-content/locale";
import { preparePreview, markdownImageReference } from "../../../lib/github-preview.js";
import { previewSession } from "../../../lib/preview-session.js";
import PreviewFailure from "../PreviewFailure.jsx";
import styles from "../preview.module.css";

export default async function SavedArticle({ params, searchParams }) {
  let preview;
  try { preview = await preparePreview(await previewSession(), (await params).slug); }
  catch (error) { return <PreviewFailure error={error} />; }
  const { post, ptPost, sourcePost, media, images, revision } = preview;
  const locale = (await searchParams)?.lang === "pt" ? "pt-BR" : "en";
  const portuguese = locale === "pt-BR";
  const displayPost = portuguese ? ptPost : post;
  const issues = portuguese ? preview.ptIssues : preview.issues;
  return <>
    <aside className={styles.panel} aria-label="Saved revision details">
      <h2>Saved preview · {sourcePost.status} · {portuguese ? "Portuguese" : "English"}</h2>
      <p>This is the saved <strong>main</strong> revision, not a publication confirmation. Unsaved edits are not shown.</p>
      {portuguese && <p>{sourcePost.pt?.publish ? "Portuguese version approved; public visibility still requires a successful release." : "Portuguese version is not approved for public release."}</p>}
      <nav className={styles.languages} aria-label="Preview language"><a href={`/preview/${sourcePost.slug}`} aria-current={!portuguese ? "page" : undefined}>English</a><a href={`/preview/${sourcePost.slug}?lang=pt`} aria-current={portuguese ? "page" : undefined}>Português</a></nav>
      <p>Commit: <code>{revision}</code></p>
      {displayPost?.publishedAt && <p>Publication time (São Paulo): {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(displayPost.publishedAt))}</p>}
      <p><a href={`/keystatic/branch/main/collection/posts/item/${sourcePost.slug}`}>Edit this article</a> · <a href={`/preview/${sourcePost.slug}`}>Reload saved version</a></p>
      {issues.length > 0 && <><h3>Before {portuguese ? "Portuguese" : "English"} publication</h3><ul>{issues.map((issue, index) => <li key={index}><code>{issue.path}</code>: {issue.message}</li>)}</ul></>}
      {images.length > 0 && <details><summary>Image references — copy into Markdown</summary>{images.map((image, index) => <label className={styles.reference} key={index}>{image.alt || "Image"}<textarea aria-label={`Markdown reference ${index + 1}`} readOnly value={markdownImageReference(image)} rows={2} /></label>)}</details>}
    </aside>
    {displayPost ? <Article post={displayPost} media={media} backLink={<a href={`https://lucas-reis.com${blogPath(locale)}`}>← Public blog</a>} /> : <p>This language has not been written yet.</p>}
  </>;
}
