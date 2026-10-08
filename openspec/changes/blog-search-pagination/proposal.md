# Proposal

## Why

The blog introduction currently narrows the writing to application security, although Lucas wants room for security topics generally and other subjects. As the archive grows, readers also need a fast way to find a term anywhere in a published article and browse more than one screen of posts without losing the static site's performance.

## What Changes

- Use broad, concise blog labels in both languages—provisionally “Posts.” and “Artigos.”—and update introductions and search metadata without changing Lucas's professional identity or article content.
- Show six eligible posts per statically exported archive page, newest first. Keep `/blog/` and `/pt/blog/` as page one; use `/blog/page/<number>/` and `/pt/blog/page/<number>/` only when those pages exist. Add compact numbered, previous/next and ellipsis controls once an archive needs more than one page.
- Add an accessible full-text keyword search on each locale's blog index. Search titles, summaries, tags and the complete Markdown body of eligible posts in that locale, including articles beyond the current archive page. Keep the query shareable in `?q=` and paginate search results when necessary.
- Keep the search lightweight for visitors who do not use it, and prevent query text from becoming executable markup, a regular expression, an unsafe URL or a route to unpublished content.
- Preserve the current static S3/CloudFront delivery, bilingual article routes, homepage latest-post feature, CMS authoring and publication cutoff. The attached pagination/input components are visual interaction references, not a request to replace the project's JavaScript/CSS Modules stack.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `blog-experience`: Broader bilingual blog introduction, static archive pagination, full-text search, locale-specific results, and consistent navigation/empty states.
- `site-quality`: Accessible and responsive search/pagination controls, safe query handling, lazy search delivery, and correct discovery metadata for numbered and query-based archive views.

## Impact

Public blog index routes/components and copy, a small build-time search artifact, the static export/release audit and sitemap, and content/SEO/accessibility/browser tests change. No search server, third-party service, new runtime dependency, editor schema change or AWS infrastructure change is planned. The existing `bilingual-blog-posts` change defines the locale eligibility this change must reuse; unrelated dirty files remain out of scope.
