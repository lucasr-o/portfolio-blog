# Spec Delta

## Purpose

Publish verified code and editorial changes to one production environment automatically, with bounded credentials, scheduled-content handling and a tested recovery path for failed releases.

## ADDED Requirements

### Requirement: Automatic production delivery
An accepted change to the designated production branch SHALL trigger validation and publication of the frontend and eligible blog content without a manual S3 upload. Publication SHALL wait for content validation, code checks, exported-site checks and required quality tests to pass.

#### Scenario: Frontend change is pushed
- **WHEN** Lucas pushes a frontend change to `main` and all release checks pass
- **THEN** the pipeline deploys the resulting static artifact and reports the commit and release identifier

#### Scenario: CMS saves a publishable article
- **WHEN** an authorized CMS save commits a valid article whose publication date has arrived to `main`
- **THEN** the same release process publishes it without an additional local Git operation

#### Scenario: Validation fails
- **WHEN** a required release check fails
- **THEN** no public objects are modified by that failed candidate and the failure is visible in the workflow result

### Requirement: Restricted deployment authority
Production deployment SHALL use short-lived AWS credentials restricted to the selected repository and production branch, with permissions scoped to this site's storage and cache invalidation. Untrusted pull requests SHALL NOT receive deployment credentials, CMS secrets or access to the home network.

#### Scenario: Untrusted contribution runs checks
- **WHEN** a pull request from a fork runs automated validation
- **THEN** it cannot obtain the production deployment role or execute code on the Raspberry Pi

#### Scenario: Production job authenticates to AWS
- **WHEN** the approved production-branch deployment job requests credentials
- **THEN** its repository identity, audience and branch match the configured trust policy without using a stored AWS access key

### Requirement: Scheduled article publication
The release system SHALL periodically evaluate saved publication dates, targeting a check every 15 minutes, and publish newly eligible content through the same validated pipeline. It SHALL document scheduling delays and inactivity limitations, provide manual recovery, and SHALL NOT promise publication at an exact minute.

#### Scenario: Scheduled publication becomes due
- **WHEN** an active scheduled check runs after an article's publication instant and its release checks pass
- **THEN** the article becomes available in the deployed public collection without requiring the Raspberry Pi to be online

#### Scenario: No publication becomes due
- **WHEN** a scheduled check finds no change to the public content set since the last successful release
- **THEN** it exits without rebuilding the site, uploading a new release or invalidating the CDN cache

#### Scenario: Scheduler has stopped after repository inactivity
- **WHEN** Lucas follows the documented recovery procedure for a disabled schedule
- **THEN** he can reactivate the workflow and manually publish currently eligible content through the normal checks

### Requirement: Serialized and recoverable releases
Production mutations SHALL be serialized. A stale candidate SHALL NOT overwrite a newer accepted branch revision. Each release SHALL record its source revision, publication cutoff and deployed object manifest, and a previous successful artifact SHALL be available for recovery.

#### Scenario: Two commits reach production close together
- **WHEN** two candidate releases compete to deploy
- **THEN** their production writes do not interleave and the older candidate cannot overwrite a newer successful release

#### Scenario: Two scheduled builds share a source commit
- **WHEN** a candidate for the same commit has an earlier publication cutoff than the active successful release
- **THEN** it cannot overwrite that release and hide articles that have already become eligible, unless an explicit rollback was requested

#### Scenario: Deployment fails after public changes begin
- **WHEN** upload, cache refresh or smoke tests fail after a candidate modified public objects
- **THEN** the pipeline attempts restoration from the preceding successful artifact, refreshes the cache and reports the original deployment as failed together with the recovery outcome

#### Scenario: Owner requests rollback
- **WHEN** Lucas selects a retained successful release for rollback
- **THEN** that artifact is restored through the same serialized delivery controls without rebuilding it using today's publication date

### Requirement: Withdrawal of published content
A successful release that removes or unpublishes an article SHALL remove its public route and navigation payloads, update discovery surfaces and refresh cached responses. Cleanup SHALL be restricted to the project's recorded deployment objects.

#### Scenario: Published article returns to draft
- **WHEN** Lucas changes a published article to draft and deployment succeeds
- **THEN** fresh requests receive HTTP 404 for its previous route and the article is absent from the home feature, blog index and sitemap, while repository history is preserved

### Requirement: Administrative application delivery
Changes to the CMS application or shared article presentation SHALL produce a versioned ARM64 application release after validation. Applying that release on the Pi SHALL affect only the dedicated CMS services, verify health and retain a previous application version for recovery. Saving posts SHALL NOT require rebuilding the CMS application.

#### Scenario: Shared article presentation changes
- **WHEN** an approved change updates the article renderer used by the site and preview
- **THEN** delivery makes the corresponding CMS version available and the dedicated updater applies it with a health check so preview does not remain indefinitely on an old renderer
