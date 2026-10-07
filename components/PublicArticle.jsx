import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import LanguageSwitch from "@/components/LanguageSwitch";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Article from "@portfolio/blog-ui/Article";
import { articlePath, blogCopy, blogPath, PORTUGUESE } from "@portfolio/blog-content/locale";
import { createBlogPostingSchema } from "@/lib/structured-data";

export default function PublicArticle({ post, media, hasPortuguese }) {
  const locale = post.locale ?? "en";
  const copy = blogCopy(locale);
  const switcher = hasPortuguese ? <LanguageSwitch locale={locale} englishHref={articlePath(post)} portugueseHref={articlePath(post, PORTUGUESE)} /> : null;
  return <>
    <JsonLd data={createBlogPostingSchema(post)} />
    <SiteHeader />
    <main id="main-content">
      <Article post={post} media={media} backLink={<Link href={blogPath(locale)}>← {copy.back}</Link>} languageSwitch={switcher} />
    </main>
    <SiteFooter />
  </>;
}
