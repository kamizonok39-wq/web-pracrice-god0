## ADDED Requirements

### Requirement: Local read-only Data API reporting

The repository SHALL provide a local Python script that reads Google Analytics Data API v1 with Application Default Credentials and the `analytics.readonly` scope. The script SHALL read a numeric GA4 property ID from `GA_PROPERTY_ID`, SHALL reject a `G-` measurement ID, and SHALL NOT modify the static website.

#### Scenario: Authorized report execution

- **WHEN** ADC is available, `GA_PROPERTY_ID` is a numeric GA4 property ID, and the caller has viewer access
- **THEN** the script prints readable console tables for seven-day daily page views, page views by page, event counts by event name, CTA events, outbound-link events, scroll events, and realtime active users

#### Scenario: Authentication-only check

- **WHEN** the user runs the script with `--check-auth`
- **THEN** the script validates and refreshes ADC using only the read-only Analytics scope without requiring a property ID or querying Analytics report data

#### Scenario: Missing or invalid property ID

- **WHEN** `GA_PROPERTY_ID` is missing, non-numeric, or begins with `G-`
- **THEN** the script stops with an actionable message and does not guess or substitute the web-stream measurement ID

### Requirement: Credential hygiene

The repository SHALL document local setup without storing credentials and SHALL ignore `.env`, ADC files, credential JSON files, service-account keys, virtual environments, and Python caches while retaining a non-secret `.env.example`.

#### Scenario: Repository secret check

- **WHEN** a contributor checks Git status before committing
- **THEN** local credentials, private keys, `.env`, and generated Python artifacts are not eligible for inclusion
