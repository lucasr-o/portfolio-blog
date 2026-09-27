# lucas-reis.dev

Static portfolio and blog for Lucas Reis, built with Next.js, React, and JavaScript.

The project intentionally keeps the content local, exports plain static files, and limits client-side JavaScript to the progressive terminal animation.

## Requirements

- Node.js 24
- pnpm 11

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm audit:bundle
pnpm lighthouse
```

Run the complete release suite with:

```bash
pnpm test:all
```

`pnpm build` writes the deployable static site to `out/`. Preview the exact exported artifact with:

```bash
pnpm preview
```

The preview is available at `http://127.0.0.1:4173`.

## Editing portfolio content

Edit [`data/profile.js`](data/profile.js) to revise the public profile:

- `site` controls the site identity and canonical origin.
- `profile` controls the hero, about copy, location, objective, and authorized telephone, email, and LinkedIn links.
- `experience` controls the five Work entries.
- `education` controls Academic Background.
- `credentials` controls certifications and learning paths.
- `terminalSteps` controls the decorative security transcript. Keep every network target under the reserved `.test` domain so examples cannot target a real system.

The UI reads these records directly; do not duplicate resume content in page components. Run `pnpm test` after an edit to validate required fields, normalized links, dates, and safe terminal targets.

## Adding a blog post

Posts live in the `posts` array in [`data/posts.js`](data/posts.js). Add one object with this shape:

```js
{
  slug: "lowercase-hyphenated-slug",
  title: "A descriptive article title",
  summary: "A concise preview and metadata description.",
  author: site.legalName,
  publishedAt: "2026-09-24",
  readingTime: "5 min read",
  tags: ["Application Security"],
  introduction: "Opening paragraph.",
  sections: [
    {
      heading: "Section heading",
      paragraphs: ["Section paragraph."],
    },
  ],
}
```

The newest ISO `publishedAt` value is selected automatically for Latest Writing and receives featured treatment on `/blog`. Every post is included by `generateStaticParams`, so no route component needs to be created. Verify a new record with:

```bash
pnpm test
pnpm build
```

Confirm the resulting article exists at `out/blog/<slug>/index.html` before deploying.

## Static routes

- `/` — Work, About, Academic Background, Credentials, Contact, and Latest Writing
- `/blog/` — blog index with the newest article featured
- `/blog/security-reviews-that-move-at-product-speed/` — placeholder article

`sitemap.xml` and `robots.txt` are generated during the static build.
