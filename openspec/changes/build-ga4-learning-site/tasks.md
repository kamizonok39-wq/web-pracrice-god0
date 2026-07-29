## 1. Project foundation

- [x] 1.1 Create the static directory structure for shared CSS, shared JavaScript, images, products, articles, and the contact completion page.
- [x] 1.2 Add shared semantic page chrome, responsive navigation, footer, skip link, focus styling, and reusable card/CTA styles.
- [x] 1.3 Add only fictional, non-personal product and article content needed by every specified page type.

## 2. Page implementation

- [x] 2.1 Build the top page with the learning purpose, featured products, featured articles, measurable-action guidance, and analytics consent control.
- [x] 2.2 Build the product list and at least two product detail pages with list return links, related articles, and experiment-ready CTA regions.
- [x] 2.3 Build the article list and at least two long-form article detail pages with related-article navigation, product links, and external reference links.
- [x] 2.4 Build the simulated contact completion page without personal-information fields or real submission behavior.
- [x] 2.5 Verify that both specified primary user journeys and all reverse/navigation paths work at GitHub Pages project-site depth.

## 3. GA4 foundation and privacy

- [x] 3.1 Add a documented GA4 configuration module with a nonfunctional measurement-ID placeholder and debug-mode option.
- [x] 3.2 Implement Consent Mode with analytics storage denied by default and an accessible opt-in/opt-out control.
- [x] 3.3 Implement the shared analytics sender so console learning logs remain available while invalid configuration, denied consent, blocked scripts, and network failures do not affect navigation.
- [x] 3.4 Add a centralized event contract documenting each event name, required parameters, and firing condition in code.
- [x] 3.5 Add automated or repeatable checks that event payloads never contain form values, user IDs, or other personal identifiers.

## 4. Event measurement

- [x] 4.1 Implement one explicit `page_view` per consented page load with title, location, path, and page type.
- [x] 4.2 Implement delegated `cta_click` tracking using readable `data-ga-*` attributes and experiment parameters.
- [x] 4.3 Implement `article_navigation` tracking for article cards, related articles, breadcrumbs, and in-article links.
- [x] 4.4 Implement `outbound_click` tracking for cross-host HTTP(S) links without blocking normal link behavior.
- [x] 4.5 Implement deduplicated `scroll_depth` events at 25%, 50%, 75%, 90%, and 100%.
- [x] 4.6 Verify in console debug mode that each user action emits the expected event once with all required anonymous parameters.

## 5. CTA experiment

- [x] 5.1 Define experiment `product-detail-primary-cta-v1` with A/B text or placement differences and the same destination.
- [x] 5.2 Implement balanced random assignment stored only for the browser session, without persistent or identifying IDs.
- [x] 5.3 Implement `?variant=a|b` overrides and safe fallback for invalid values.
- [x] 5.4 Implement one `experiment_impression` per experiment CTA page view and include experiment data in `cta_click`.
- [ ] 5.5 Verify variants A and B on mobile and desktop for keyboard access, focus visibility, overlap, and identical destination behavior.

## 6. Documentation

- [x] 6.1 Write README prerequisites, repository structure, local HTTP-server instructions, and the learning workflow.
- [x] 6.2 Document GA4 property/web-stream setup, measurement-ID configuration, consent behavior, DebugView, and disabling overlapping Enhanced Measurement events.
- [x] 6.3 Document event names, firing conditions, parameters, custom dimensions, and the CTA click-rate calculation with the small-sample warning.
- [x] 6.4 Document GitHub Pages deployment from `main`, published URL verification, rollback/disable steps, and troubleshooting.

## 7. Acceptance verification

- [x] 7.1 Validate internal links and assets at the repository subpath and confirm all six page types plus multiple product/article details are reachable.
- [ ] 7.2 Test all page types at 320px, 390px, and desktop widths with keyboard-only operation and no horizontal overflow.
- [x] 7.3 Run HTML and accessibility checks, achieve Lighthouse Accessibility 90 or higher, and resolve all critical issues.
- [x] 7.4 Run mobile Lighthouse checks, achieve Performance 90 or higher and CLS 0.1 or lower, and document results.
- [ ] 7.5 Test measurement-ID missing, consent denied, consent granted, invalid variant, and blocked-GA4 failure paths without uncaught errors.
- [x] 7.6 Verify each event and required parameter in GA4 DebugView using a test property, with no duplicate events or personal information.
- [ ] 7.7 Review every OpenSpec scenario and record evidence that each acceptance condition passes before publishing.
