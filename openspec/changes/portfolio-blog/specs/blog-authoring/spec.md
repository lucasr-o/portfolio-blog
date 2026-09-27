# Spec Delta

## Purpose

Enable Lucas to author and preview Markdown blog articles in a browser, with repository-backed persistence and an administrative service isolated from the public site and existing home-server workloads.

## ADDED Requirements

### Requirement: Browser-based Markdown source authoring
The editorial interface SHALL allow Lucas to type and paste raw Markdown source for blog articles without requiring a visual block editor. It SHALL expose title, slug, summary, tags, publication state, publication date, author, and image fields. Portfolio content SHALL remain outside the editable collections.

#### Scenario: Author saves source Markdown
- **WHEN** Lucas enters headings, links, a table and fenced code in the body field, saves the article and reopens it
- **THEN** the body remains editable as Markdown source with its syntax and meaningful whitespace preserved

#### Scenario: Author saves an incomplete draft
- **WHEN** Lucas saves a new draft with a valid unique slug but incomplete publication metadata
- **THEN** the editor retains the draft without publishing it and identifies the fields still required for publication

#### Scenario: Author supplies invalid publication data
- **WHEN** Lucas attempts to publish an article with a duplicate slug, invalid date, missing summary or empty body
- **THEN** validation identifies the affected field and no successful public release containing that invalid article is produced

### Requirement: Repository-backed editorial persistence
Saving an article or its uploaded media SHALL persist a recoverable change to the designated GitHub repository. The interface and operating guide SHALL distinguish saving a draft to the public repository from making an article visible on the website. A failed save SHALL NOT be reported as successful.

#### Scenario: Author saves while the repository is available
- **WHEN** Lucas successfully saves an edited article
- **THEN** its content is recoverable from repository history and remains available after the administrative service is restarted

#### Scenario: GitHub rejects a save
- **WHEN** repository access expires, a conflicting update occurs or the repository is unavailable
- **THEN** the editor presents a failure or reauthentication path without falsely confirming persistence

#### Scenario: Draft confidentiality is explained
- **WHEN** Lucas reads the publishing instructions
- **THEN** they state that drafts and scheduled content can already be read in the public repository even when excluded from the public site

### Requirement: Saved article preview
The administrative service SHALL offer a protected preview of the latest saved article, including drafts and future-dated articles, using the same article presentation and Markdown rendering rules as the public site. It SHALL identify the article state and saved revision being previewed. Unsaved live preview is not required.

#### Scenario: Author previews a newly saved draft
- **WHEN** Lucas saves a draft and opens its preview without rebuilding or restarting the administrative service
- **THEN** the preview displays that saved revision, its images, metadata and rendered Markdown while the article remains absent from the public website

#### Scenario: Visitor requests an administrative preview
- **WHEN** a request without valid administrative access targets a preview or its media
- **THEN** access is denied and no shared-cache response reveals the preview

### Requirement: Administrative access protection
The CMS SHALL be reachable through HTTPS at a dedicated hexadecimal subdomain of `lucas-reis.com`. HTTP Basic Authentication SHALL protect all administrative paths, including assets, APIs, previews and authentication callbacks. Repository authorization SHALL additionally use Lucas's GitHub access; credentials SHALL NOT be embedded in public bundles, logs or repository files.

#### Scenario: Unauthorized visitor requests any administrative path
- **WHEN** a request lacks valid HTTP Basic credentials
- **THEN** it receives an authentication challenge without receiving protected page, API or media content

#### Scenario: Authorized author completes repository login
- **WHEN** Lucas passes HTTP authentication and completes the GitHub login flow
- **THEN** the callback returns to the intended HTTPS administrative hostname and authorized editing works without bypassing the HTTP protection

#### Scenario: Administrative service is contacted outside the tunnel
- **WHEN** an external client attempts to reach the CMS directly on the home's public address
- **THEN** no CMS host port is exposed for that access path

### Requirement: Editorial image handling
The editor SHALL support PNG, JPEG and WebP uploads of at most 5 MiB each, provide a Markdown reference for insertion, and require descriptive alternative text for published informative images. Published articles SHALL serve their referenced images independently of the CMS.

#### Scenario: Author uploads an image for a draft
- **WHEN** Lucas uploads a supported image and inserts its reference in Markdown
- **THEN** it is saved with the editorial content and appears in the protected preview before public deployment

#### Scenario: Invalid media is supplied
- **WHEN** a file exceeds the upload limit, has an unsupported type, or references a path outside the allowed media collection
- **THEN** validation rejects it with an actionable message rather than publishing it

### Requirement: Isolated home-server operation
The CMS, authentication proxy, tunnel and update mechanism SHALL operate in resources dedicated to this project, without modifying, stopping or restarting the Overleaf containers, volumes, networks or tunnel. CMS deployments SHALL be health-checked and recoverable to the previous application version without losing saved posts.

#### Scenario: CMS is installed or updated
- **WHEN** the portfolio CMS stack is deployed or updated
- **THEN** only this project's resources are changed and the existing Overleaf workload retains its configuration and running state

#### Scenario: CMS update is unhealthy
- **WHEN** a new CMS version fails its health check
- **THEN** the previous healthy version is restored and saved articles remain available in GitHub
