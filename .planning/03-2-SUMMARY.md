# Phase 03 — Plan 2 Summary

## Objective
Add a practical automated QA layer — Playwright smoke tests, axe accessibility checks, and Lighthouse CI — so regressions in key pages and interactions are caught before merge.

## What changed
- Added `playwright.config.ts` with preview-backed local test execution and HTML reporting.
- Added `tests/smoke.spec.ts` covering:
  - homepage render and critical sections
  - privacy page render
  - Upwork modal open/close interaction
  - homepage axe smoke scan
  - privacy-page axe smoke scan
- Added `.lighthouserc.json` with pragmatic release gates:
  - accessibility stays strict (`error`, min score `0.95`)
  - SEO stays strong (`warn`, min score `0.9`)
  - performance is tracked as a warning (`warn`, min score `0.5`) so regressions stay visible without making the gate unusably brittle.
- Added `scripts/run-lighthouse-ci.mjs` to run Lighthouse against the built static site via a small local static server, then assert against saved reports in `.lighthouseci/`.
- Updated `package.json` scripts for `test:smoke`, `test:lighthouse`, and `test:lighthouse:assert`.
- Extended `.github/workflows/ci.yml` so CI now runs `npm ci`, `npm run check`, `npm run build`, `npm run test:smoke`, and `npm run test:lighthouse`, then uploads Playwright and Lighthouse artifacts.
- Updated `.gitignore` / `.prettierignore` to keep generated QA artifacts out of normal source control and formatting runs.

## Tickets addressed
- #17 — substantial implementation complete: smoke tests, axe checks, Lighthouse gating, and CI wiring now exist.
- #21 — visibility improved, not closed: Lighthouse now leaves concrete perf signals in CI instead of pretending the remaining risk is solved.

## Verification run
- `npm run test:smoke`
- `npm run test:lighthouse`
- `npm run check`
- `npm run build`

## Result
- Playwright smoke coverage passes locally.
- Axe smoke coverage passes locally on homepage and privacy page.
- Lighthouse assertions now pass with accessibility/SEO gates and a visible homepage performance warning.
- The current homepage performance score is still below the warning target on `/` (observed `0.38` against warn threshold `0.5`), which is intentional visibility rather than a false hard failure.

## Notes
- `lhci autorun` on this Windows host was not reliable enough because of launcher/runtime cleanup failures (`spawn EINVAL` and temp-dir `EPERM` in Chrome cleanup). The final repo solution is a deterministic in-repo runner using Lighthouse CLI plus `lhci assert` on saved reports.
- That is a real engineering fix, not a fake green build: the reports are generated, assertions run, and CI on Ubuntu should be more stable than this workstation.
- Performance work remains for the larger homepage refactor in Plan 3 rather than being papered over here.
