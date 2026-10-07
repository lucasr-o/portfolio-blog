# Spec Delta

## MODIFIED Requirements

### Requirement: Search metadata
Each public route SHALL provide a unique title, description, canonical URL and social sharing metadata appropriate to its content, using `https://lucas-reis.com` as the canonical origin. Localized blog routes SHALL set the document language and expose their own localized metadata, canonical URL and article structured data; public English/Portuguese counterparts SHALL have reciprocal language-alternate annotations. The site SHALL expose crawl directives and a sitemap containing only eligible public versions. Drafts, future-dated articles, unapproved or incomplete translations, and administrative routes SHALL NOT appear in public discovery metadata.

#### Scenario: Search crawler requests a route
- **WHEN** a crawler requests `/`, `/blog`, `/pt/blog` or an eligible article URL
- **THEN** initial HTML contains the route's primary content and route-specific metadata without requiring client-side script execution, with canonical and social URLs on `lucas-reis.com`

#### Scenario: Localized article is inspected
- **WHEN** both versions of an article are public
- **THEN** the English and Portuguese pages declare the correct HTML language, use their own localized title and summary, and reference each other as language alternates without canonicalizing one language to the other

#### Scenario: Only English article exists
- **WHEN** an English article has no eligible Portuguese version
- **THEN** its public metadata and sitemap do not claim a Portuguese article counterpart

#### Scenario: Structured data is inspected
- **WHEN** structured data on the home page and either article locale is parsed
- **THEN** it describes Lucas Reis as a Person on the home page and the displayed article as a BlogPosting with matching author, localized title, language, dates and canonical origin on the article page

#### Scenario: Editorial states differ
- **WHEN** the repository contains published, draft and future-dated articles plus unfinished translations
- **THEN** the public sitemap and discoverable article metadata contain only eligible published article versions used by the pages

#### Scenario: Administrative preview is inspected
- **WHEN** an authorized author opens an administrative preview in either language
- **THEN** it requests no indexing and is not listed in the public sitemap or linked as a public canonical route
