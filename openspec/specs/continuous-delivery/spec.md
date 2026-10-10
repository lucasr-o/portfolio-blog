# Continuous Delivery Specification

## Purpose

Defines quiet, verified production publication for the Git-backed static blog so eligible public changes are deployed on commits without relying on the CMS for visitor traffic.

## Requirements

### Requirement: Commit-driven public publication
A successful CMS commit to the production branch that publishes, edits, translates, or withdraws a public language version SHALL trigger the validated static release process without another author action. Failed validation SHALL leave the active release unchanged. After deployment, visitor requests SHALL NOT depend on the Raspberry Pi or CMS.

#### Scenario: Author publishes Portuguese
- **WHEN** a valid Portuguese-only article is saved as Published to `main`
- **THEN** the push triggers verification and a successful release adds its Portuguese public surfaces only

#### Scenario: Author edits a published version
- **WHEN** a published English or Portuguese version changes on `main`
- **THEN** verification updates its page, index, search data, and metadata

#### Scenario: Author withdraws a version or article
- **WHEN** one language is unapproved or the article returns to Draft and release succeeds
- **THEN** former public routes and discovery entries are removed while repository history remains

### Requirement: No scheduled publication polling
The site release SHALL have no time-based trigger or Scheduled article state. Public availability SHALL change only after an accepted production-branch push or authorized manual recovery. Legacy scheduled records SHALL NOT become public automatically during migration.

#### Scenario: No one commits a change
- **WHEN** there is no production-branch commit
- **THEN** no periodic site-publication run starts

#### Scenario: Legacy scheduled record is encountered
- **WHEN** migration finds a future Scheduled record that was not public
- **THEN** it stays non-public until explicitly reviewed and published

#### Scenario: Already-visible legacy scheduled record is encountered
- **WHEN** migration finds a Scheduled record already visible to visitors
- **THEN** visibility is preserved only after explicit review without silently changing URL or date

### Requirement: Skip unchanged public output
The pipeline SHALL verify the candidate and distinguish public-output changes from draft-only saves. A save that changes no public page, asset, search/sitemap artifact, or frontend code SHALL NOT upload a new release or invalidate CloudFront. Same-slug public edits and withdrawals SHALL NOT be skipped. Manual recovery SHALL remain available.

#### Scenario: Draft is saved repeatedly
- **WHEN** a draft or incomplete optional translation changes without public output changing
- **THEN** the workflow reports no deployment required and retains the active release

#### Scenario: Published text changes under the same slug
- **WHEN** published Markdown changes without a slug or visibility change
- **THEN** the pipeline detects and deploys the changed public output after validation

#### Scenario: Recovery is requested
- **WHEN** manual release is invoked after correcting a failure
- **THEN** normal validation, freshness, and recovery safeguards apply
