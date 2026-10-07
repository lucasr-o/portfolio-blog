import { profile, site } from "@/data/profile";
import { articlePath } from "@portfolio/blog-content/locale";

export function createPersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: site.url,
    jobTitle: profile.role,
    email: profile.contact.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Santo André",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    sameAs: [profile.contact.linkedIn, profile.contact.github, profile.contact.x],
  };
}

export function createBlogPostingSchema(post) {
  const locale = post.locale ?? "en";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    inLanguage: locale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}${articlePath(post, locale)}`,
    keywords: post.tags.join(", "),
  };
}
