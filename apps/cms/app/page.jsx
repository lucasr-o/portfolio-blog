import Link from "next/link";

export default function CmsHome() {
  return <main>
    <h1>Blog editor</h1>
    <p><Link href="/keystatic">Open the Markdown editor</Link> · <a href="/preview">Saved GitHub previews</a></p>
    <p>Save first, then preview the saved revision. Drafts and scheduled articles are readable in the public GitHub repository, even before website publication.</p>
    <p>Only blog content is managed here. The portfolio stays in code.</p>
  </main>;
}
