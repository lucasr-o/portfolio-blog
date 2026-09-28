# lucas-reis.com

Static portfolio and blog for Lucas Reis, built with Next.js, React, and JavaScript.

The public application exports static HTML and assets, with small client components for the terminal and scroll reveals. The separate Node-based CMS lives in `apps/cms`; it is never exported to S3. GitHub authoring, uploads and saved-revision previews work locally. Release automation and the isolated CMS container are implemented, but AWS and the Raspberry Pi have not been connected yet; the site is not live from this repository.

## Requirements

- Node.js 24
- pnpm 11

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`.

In a second terminal, run `pnpm dev:cms` for the editorial service at `http://127.0.0.1:3001`. It binds to loopback for local development. Build it separately with `pnpm build:cms`, then run `pnpm start:cms`. The production container will use its own internal port; it must not expose a host port on the Pi.

Open `/keystatic` on the CMS server. Development uses local files by default, so saves modify this checkout. Production always uses GitHub storage and requires a configured GitHub App; `.env.example` lists its variables, not working credentials. Never expose the development server through the Tunnel. Browser tests use a separate temporary content directory and port 3002.

## Workspace

- `app/`, `components/`, `public/`: existing public site, built into `out/`.
- `apps/cms/`: Keystatic server and saved-revision previews (separate build).
- `packages/blog-content/`: shared editorial validation, publication selection and media manifest.
- `packages/blog-ui/`: server-rendered Markdown and article presentation, shared by site and preview.
- `content/posts/`: YAML article records with raw Markdown strings.
- `content/media/`: original editorial uploads, outside the public directory.

The CMS does not edit the portfolio. The existing Overleaf services and the old portfolio repository are outside this project's deployment scope.

## Quality checks

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm audit:bundle
pnpm lighthouse
pnpm test:cms:update
pnpm test:cms:compose
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
- `profile` controls the hero, about copy, location, objective, photo, email, and social links. No telephone is published.
- `experience` controls the five Work entries.
- `education` controls Academic Background.
- `credentials` controls certifications and learning paths.
- `terminalSteps` controls the decorative security transcript. Keep every network target under the reserved `.test` domain so examples cannot target a real system.

The UI reads these records directly; do not duplicate resume content in page components. Run `pnpm test` after an edit to validate required fields, normalized links, dates, and safe terminal targets.

## Adding a blog post

Read [the browser editor guide](docs/blog-editor.md) for writing, uploads, saved previews and session recovery, and [the editorial format guide](docs/editorial-content.md) for YAML/Markdown details. The checked-in example preserves the original article URL and adds Markdown demonstrations. Drafts and future articles are excluded from the site, **but remain readable in this public repository**.

`pnpm build` captures one publication instant, validates content, generates a shared snapshot for every route, and exports only referenced eligible media. To reproduce a specific publication cutoff:

```bash
BLOG_PUBLICATION_TIME=2026-09-27T18:00:00Z pnpm build
```

The newest eligible article is featured automatically. An empty collection is supported. Verify edits with:

```bash
pnpm test
pnpm build
```

Confirm the resulting article exists at `out/blog/<slug>/index.html` before deploying.

## Production delivery (not activated yet)

The intended public path is CloudFront with OAC to `site/` in a private S3 bucket. Once the five repository variables and AWS OIDC role in [the AWS setup guide](openspec/changes/portfolio-blog/aws-manual.md) are configured, a push to `main` runs the checks and publishes a verified static snapshot. Scheduled checks every 15 minutes publish due posts if the public collection changes. The [CMS operations guide](docs/cms-operations.md) covers the separate Keystatic ARM64 image, dedicated Compose project and Cloudflare Tunnel on the Pi. Neither workflow modifies the Overleaf project.

Before AWS variables exist, pushes still run validation but deliberately do not deploy. The public site is independent of CMS uptime after a successful publish. A failed release restores the previous snapshot; the separate manual rollback workflow remains available even when the publish workflow is paused.

## Static routes

- `/` — Work, About, Academic Background, Credentials, Contact, and Latest Writing
- `/blog/` — blog index with the newest article featured
- `/blog/security-reviews-that-move-at-product-speed/` — placeholder article

`sitemap.xml` and `robots.txt` are generated during the static build.
