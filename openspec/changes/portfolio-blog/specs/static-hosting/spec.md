# Spec Delta

## Purpose

Deliver the portfolio and published articles through a secure static hosting boundary with correct direct-route behavior, cache freshness and independence from the author's home server.

## ADDED Requirements

### Requirement: Private-origin public delivery
Public site traffic SHALL use HTTPS through CloudFront to a private S3 origin authorized by OAC. Anonymous direct S3 access SHALL remain denied. CloudFront origin access SHALL be limited to the public site objects and the designated distribution.

#### Scenario: Visitor opens the production website
- **WHEN** a visitor requests `https://lucas-reis.com/`
- **THEN** CloudFront returns the exported home page over a valid HTTPS connection using its authorized S3 origin

#### Scenario: Client bypasses the CDN
- **WHEN** an anonymous client requests a known site object directly from S3
- **THEN** access is denied even though that object is available through CloudFront

#### Scenario: Client requests deployment storage
- **WHEN** a visitor requests a release snapshot, deploy-state record or administrative path through the public distribution
- **THEN** no private deployment or administrative content is returned

### Requirement: Static route resolution
The distribution SHALL serve exported pages for direct requests, browser refreshes and client-side navigation. Asset requests SHALL retain their asset identity. Unknown page routes SHALL return a not-found page with HTTP status 404, not the home page with a successful status.

#### Scenario: Reader refreshes an article
- **WHEN** a reader directly opens or refreshes a published `/blog/<slug>/` URL
- **THEN** the article's initial HTML and matching assets load without a client-only redirect to the home page

#### Scenario: Visitor uses a route without a trailing slash
- **WHEN** a visitor requests `/blog` or a valid article URL without its trailing slash
- **THEN** the corresponding page resolves or redirects consistently to its canonical trailing-slash URL

#### Scenario: Browser loads a static navigation payload
- **WHEN** the browser requests an exported JavaScript, CSS, image or framework navigation payload
- **THEN** the distribution returns that resource with the correct content type rather than rewriting it into an HTML page

#### Scenario: Unknown or unpublished article is requested
- **WHEN** a visitor requests a nonexistent, draft or not-yet-published article URL
- **THEN** the response is HTTP 404 and does not disclose the article body

### Requirement: Public cache freshness
Versioned immutable assets SHALL support long-lived caching. Mutable documents and unversioned assets SHALL have short, explicitly configured cache lifetimes. Successful release delivery SHALL refresh affected edge responses so new content and removals become visible without requiring visitors to clear browser storage.

#### Scenario: Existing page is updated
- **WHEN** a successful release changes an article and completes cache refresh
- **THEN** a fresh browser request returns the new document with assets matching the deployed version

#### Scenario: Browser retains a previous page version
- **WHEN** a browser holding a previous document requests that release's versioned assets during the retention window
- **THEN** the assets remain available rather than being removed by a broad deployment cleanup

### Requirement: Public-site independence from the CMS
Serving published portfolio pages, articles and editorial images SHALL NOT require the Raspberry Pi, its tunnel, a CMS API call or GitHub access at request time.

#### Scenario: Home server is offline
- **WHEN** the Raspberry Pi or its internet connection is unavailable
- **THEN** visitors can still load the deployed home page, blog, articles and their published images through CloudFront

### Requirement: Manual infrastructure operating guide
The project SHALL provide a reproducible manual setup and recovery guide identifying required resources, substitutions, security settings, cost assumptions, validation checks and rollback procedures. It SHALL distinguish setup instructions from resources that have actually been provisioned and SHALL preserve unrelated DNS and home-server services.

#### Scenario: Owner prepares production manually
- **WHEN** Lucas follows the guide
- **THEN** it identifies the required AWS, GitHub and DNS values, verification outcomes and remaining implementation prerequisites without requiring Terraform

#### Scenario: Owner reviews cost controls
- **WHEN** Lucas reviews the selected AWS plan and alerts
- **THEN** the guide distinguishes product allowances from account credits and does not present a budget alert as an automatic spending cap
