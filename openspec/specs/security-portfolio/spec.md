# Security Portfolio Specification

## Purpose

Defines the public portfolio experience that presents Lucas Reis as an Application Security Engineer and makes his work, background, and contact paths easy to understand.

## Requirements

### Requirement: Professional hero
The home page SHALL identify Lucas Reis de Oliveira da Silva as an Application Security Engineer through a concise primary heading and supporting text, and SHALL provide clear paths to selected work and the blog.

#### Scenario: Visitor lands on the home page
- **WHEN** a visitor opens `/`
- **THEN** the initial viewport communicates Lucas Reis de Oliveira da Silva's name, Application Security Engineer role, and links to Work and Blog

### Requirement: Security terminal presentation
The home page SHALL present a minimal terminal-style visual that uses a short sequence of application-security commands against fictional or reserved targets, including examples based on `nmap`, `sqlmap`, and a source-code security scanner.

#### Scenario: Terminal enters the viewport with motion enabled
- **WHEN** the terminal first becomes visible and the visitor has not requested reduced motion
- **THEN** the command sequence runs once, reveals concise outputs in order, and finishes without entering an endless loop

#### Scenario: Terminal is viewed with reduced motion
- **WHEN** the visitor has requested reduced motion
- **THEN** the complete terminal transcript is displayed immediately without typing, blinking, or sequential reveal effects

#### Scenario: Terminal content is interpreted by assistive technology
- **WHEN** a visitor uses a screen reader or animation does not execute
- **THEN** an equivalent concise description or completed transcript remains available without announcing each animated character

### Requirement: Selected work section
The home page SHALL contain a `Work` section that presents the supplied professional, research, and community experience in a scannable format with role, organization, dates, location when available, and concise responsibility or outcome highlights.

#### Scenario: Visitor follows the Work navigation choice
- **WHEN** a visitor activates `Work` from the home-page top bar
- **THEN** focus and viewport navigation lead to the Work section without loading another page

#### Scenario: Visitor reviews the supplied experience
- **WHEN** a visitor reads the Work section
- **THEN** it includes Cybersecurity Engineer at Mercado Livre, Application Security Engineer at PagBank, Cyber Security Trainee at Go Ahead IT, Scholarship Research at UFABC, and Information Security Coordinator at Green Team Hacker Club with their supplied dates and highlights

### Requirement: About section
The home page SHALL contain an `About` section that provides a concise professional biography focused on application security, penetration testing, security leadership, and collaboration with product and engineering teams.

#### Scenario: Visitor follows the About navigation choice
- **WHEN** a visitor activates `About` from the home-page top bar
- **THEN** focus and viewport navigation lead to the About section without loading another page

#### Scenario: Visitor reads the professional objective
- **WHEN** a visitor reads the About section
- **THEN** it communicates the supplied objective of growing as a security engineer, deepening penetration-testing expertise, and progressing toward leadership

### Requirement: Academic background section
The home page SHALL contain an `Academic Background` section that lists the Bachelor of Computer Science at Federal University of ABC with expected completion in 2026 and the Computer Networks Technician program at SENAI-SP from 2019 to 2020.

#### Scenario: Visitor reviews academic history
- **WHEN** a visitor reaches the Academic Background section
- **THEN** each entry exposes its qualification, institution, and date in a readable hierarchy

### Requirement: Credentials section
The home page SHALL contain a `Credentials` section that presents the supplied ISC2, Cisco, and University of Cambridge achievements without reproducing resume formatting artifacts.

#### Scenario: Visitor reviews professional credentials
- **WHEN** a visitor reaches the Credentials section
- **THEN** it lists ISC2 Certified in Cybersecurity with its March 2023 date, the supplied Cisco certificate collection, and the University of Cambridge B1 English certificate with its December 2019 date

### Requirement: Contact section
The home page SHALL contain a `Contact` section that displays Santo André, SP, email `contato@lucas-reis.com`, LinkedIn profile `https://www.linkedin.com/in/lucas-reis-o`, GitHub profile `https://github.com/lucasr-o`, and X profile `https://x.com/lucasreis_lk`. The public contact section SHALL NOT display a telephone number.

#### Scenario: Visitor follows the Contact action
- **WHEN** a visitor activates `Contact` from the top bar
- **THEN** focus and viewport navigation lead to the Contact section where the email, LinkedIn, GitHub, and X destinations are operable
