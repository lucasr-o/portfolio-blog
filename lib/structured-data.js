import { profile, site } from "@/data/profile";

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
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}/blog/${post.slug}/`,
    keywords: post.tags.join(", "),
  };
}
