# Spec Delta

## MODIFIED Requirements

### Requirement: Search metadata
Each public route SHALL provide a unique title, description, canonical URL and social sharing metadata appropriate to its content, using `https://lucas-reis.com` as the canonical origin. The site SHALL expose crawl directives, a sitemap and structured data for the person and eligible blog articles. Drafts, future-dated articles and administrative routes SHALL NOT appear in public discovery metadata.

#### Scenario: Search crawler requests a route
- **WHEN** a crawler requests `/`, `/blog` or an eligible article URL
- **THEN** initial HTML contains its primary content and route-specific metadata without requiring client-side script execution, with canonical and social URLs on `lucas-reis.com`

#### Scenario: Structured data is inspected
- **WHEN** structured data on the home page and an eligible article is parsed
- **THEN** it describes Lucas Reis as a Person and the displayed article as a BlogPosting with matching author, title, dates and canonical origin

#### Scenario: Editorial states differ
- **WHEN** the repository contains published, draft and future-dated articles
- **THEN** the public sitemap and discoverable article metadata contain only the eligible published collection used by the pages

#### Scenario: Administrative preview is inspected
- **WHEN** an authorized author opens an administrative preview
- **THEN** it requests no indexing and is not listed in the public sitemap or linked as a public canonical route
