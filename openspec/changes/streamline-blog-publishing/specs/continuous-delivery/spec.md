# Spec Delta

## Purpose

Defines low-noise production delivery for the Git-backed static blog: public changes follow successful commits, drafts do not trigger unnecessary deployment, and releases remain verified and recoverable.

## ADDED Requirements

### Requirement: Commit-driven public publication
A successful CMS commit to the production branch that first publishes, edits, translates or withdraws a public language version SHALL trigger the validated static release process without another author action. A failed validation SHALL leave the active public release unchanged. Publication SHALL NOT require the Raspberry Pi or CMS to serve visitor requests after deployment.

#### Scenario: Author publishes Portuguese
- **WHEN** Lucas saves a valid Portuguese-only `Published` article to `main`
- **THEN** the push triggers verification and a successful release adds only its Portuguese public surfaces

#### Scenario: Author edits a published version
- **WHEN** Lucas saves an edit to a published English or Portuguese version on `main`
- **THEN** the push triggers a verified release that updates its page, index, search data and metadata

#### Scenario: Author withdraws a version or article
- **WHEN** Lucas unpublishes one language or returns the entire article to `Draft` and the release succeeds
- **THEN** its former public routes and discovery entries are removed and the CDN is refreshed while repository history remains

### Requirement: No scheduled publication polling
The site-release workflow SHALL have no time-based trigger or `Scheduled` article state. Public availability SHALL change only after an accepted production-branch push or an authorized manual recovery run. Existing scheduled records SHALL NOT become public automatically during migration.

#### Scenario: No one commits a change
- **WHEN** there is no new production-branch commit
- **THEN** no periodic site-publication run is started

#### Scenario: Legacy scheduled record is encountered
- **WHEN** migration encounters a future `Scheduled` record that is not already public
- **THEN** it remains non-public until Lucas explicitly reviews and publishes it under the new workflow

#### Scenario: Already-visible legacy scheduled record is encountered
- **WHEN** migration encounters a `Scheduled` record that was already visible to visitors
- **THEN** its visibility is preserved only after explicit review, without silently changing its public URL or publication date

### Requirement: Skip unchanged public output
The release pipeline SHALL verify the candidate and distinguish public-output changes from draft-only saves. A save that does not change public pages, assets, search/sitemap or frontend code SHALL NOT upload a new site release or invalidate CloudFront, while a public edit or withdrawal SHALL NOT be skipped merely because the set of article slugs is unchanged. An authorized manual dispatch SHALL remain available for recovery.

#### Scenario: Draft is saved repeatedly
- **WHEN** Lucas saves a draft or incomplete optional translation without changing public output
- **THEN** the workflow reports no public deployment required and does not replace the active release

#### Scenario: Published text changes under the same slug
- **WHEN** Lucas changes published Markdown without changing its slug or visibility
- **THEN** the workflow recognizes the changed public output and deploys it after validation

#### Scenario: Recovery is requested
- **WHEN** Lucas invokes the manual release after correcting a failed publication
- **THEN** the normal validation, freshness and recovery safeguards still apply
