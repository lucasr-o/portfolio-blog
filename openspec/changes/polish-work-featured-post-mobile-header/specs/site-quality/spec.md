# Spec Delta

## MODIFIED Requirements

### Requirement: Shared top bar
Every public page SHALL display a compact top bar containing the choices `Work / Blog / About` and a visually separated `Contact` action while preserving meaningful link names for assistive technology. On ordinary narrow mobile widths the brand and Contact SHALL form a balanced first row, with Work / Blog / About grouped beneath them; at more constrained widths or zoom the controls SHALL reflow without overlap or loss.

#### Scenario: Visitor uses the top bar on a wide viewport
- **WHEN** a visitor views any public page on a wide viewport
- **THEN** Work, Blog, and About appear as one navigation group and Contact appears as the separated final action

#### Scenario: Visitor uses the top bar on a narrow viewport
- **WHEN** the available width cannot contain the wide layout
- **THEN** the brand and Contact form a first row when space permits, Work / Blog / About remain visibly grouped beneath them, and all four choices remain reachable without overlap or horizontal overflow

#### Scenario: Visitor zooms the top bar
- **WHEN** a visitor views a public page at 200 percent zoom or a width too narrow for the first row
- **THEN** the header reflows in reading order with all destinations and visible focus indicators preserved
