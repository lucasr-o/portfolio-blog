# Spec Delta

## MODIFIED Requirements

### Requirement: Latest post feature on the home page
The English home page SHALL contain a `Latest Writing` feature derived only from the newest public English version and linking to that article. Its text, date, reading time, and destination SHALL remain English when a newer Portuguese-only article exists. The feature SHALL use a compact, visually restrained treatment that remains distinguishable from surrounding content without competing with the terminal as the home page's main visual accent.

#### Scenario: Visitor reviews the latest writing feature
- **WHEN** at least one English version is public
- **THEN** the home page shows its newest English title, summary, publication date, reading time, and working article link in a compact, readable layout

#### Scenario: Blog content changes
- **WHEN** an English version with a newer English first-publication date becomes public
- **THEN** the home feature and English blog-index feature both resolve to it without duplicated content

#### Scenario: A newer Portuguese-only article is published
- **WHEN** a Portuguese-only article is newer than every public English article
- **THEN** the home feature remains on the newest available English article

#### Scenario: No English version is public
- **WHEN** no English version is public
- **THEN** the home page does not substitute Portuguese prose into its English feature

#### Scenario: Visitor views the feature at a narrow width
- **WHEN** the home page is displayed at 320 CSS pixels or 200 percent zoom
- **THEN** the latest-post feature remains readable, reveals its article link, and causes no page-level horizontal scrolling
