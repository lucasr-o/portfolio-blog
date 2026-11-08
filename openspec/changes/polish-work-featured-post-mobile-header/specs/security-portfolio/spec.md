# Spec Delta

## MODIFIED Requirements

### Requirement: Selected work section
The home page SHALL contain a `Work` section that presents the supplied professional, research, and community experience in a scannable format with role, organization, dates, location when available, and concise responsibility or outcome highlights. Organization logos that are displayed SHALL sit on a consistent white background with balanced apparent size and alignment; their presentation SHALL NOT obscure the organization name or supporting experience text.

#### Scenario: Visitor follows the Work navigation choice
- **WHEN** a visitor activates `Work` from the home-page top bar
- **THEN** focus and viewport navigation lead to the Work section without loading another page

#### Scenario: Visitor reviews the supplied experience
- **WHEN** a visitor reads the Work section
- **THEN** it includes Cybersecurity Engineer at Mercado Livre, Application Security Engineer at PagBank, Cyber Security Trainee at Go Ahead IT, Scholarship Research at UFABC, and Information Security Coordinator at Green Team Hacker Club with their supplied dates and highlights

#### Scenario: Visitor scans organization logos
- **WHEN** the Work section is displayed on a desktop or narrow viewport
- **THEN** each supplied logo appears within a consistent white frame, is fully visible without distortion or cropping, and has a comparable visual weight while the adjacent organization name remains readable
