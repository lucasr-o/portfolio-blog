import { site } from "./profile";

export const posts = [
  {
    slug: "security-reviews-that-move-at-product-speed",
    title: "Security reviews that move at product speed",
    summary:
      "A practical placeholder for turning application-security reviews into focused decisions without slowing delivery.",
    author: site.legalName,
    publishedAt: "2026-09-18",
    readingTime: "6 min read",
    tags: ["Application Security", "Threat Modeling", "Product Security"],
    introduction:
      "Security reviews work best when they reduce uncertainty for the people building the product. This placeholder article demonstrates the structure future writing will use on lucas-reis.dev.",
    sections: [
      {
        heading: "Start with the decision",
        paragraphs: [
          "A review should begin with the product decision that needs security context: what is changing, which trust boundary moves, and what failure would matter most.",
          "That framing keeps the conversation anchored in risk instead of producing a catalogue of controls with no owner or delivery path.",
        ],
      },
      {
        heading: "Model the smallest useful system",
        paragraphs: [
          "Map the actors, sensitive data, entry points, and external dependencies needed to explain the change. Expand the model only when another boundary affects the decision.",
          "A compact model is easier to challenge with engineers and more likely to remain current after the review.",
        ],
      },
      {
        heading: "Leave teams with an executable next step",
        paragraphs: [
          "Each finding should state the observed condition, credible abuse path, expected impact, and the smallest effective remediation. Assign an owner and a verification method before the review closes.",
          "The result is not a perfect diagram. It is a shared understanding that improves the next product decision.",
        ],
      },
    ],
  },
];

export const sortedPosts = [...posts].sort(
  (left, right) => new Date(right.publishedAt) - new Date(left.publishedAt),
);

export const latestPost = sortedPosts[0];

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug);
}

export function formatPostDate(date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date));
}
