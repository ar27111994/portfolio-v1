# Phase 03 — Plan 2: automated browser QA and release gates

## Objective
Add a practical automated QA layer — Playwright smoke tests, axe accessibility checks, and Lighthouse CI — so regressions in key pages and interactions are caught before merge.

## Related requirements
- REQ-05
- REQ-07

## Related tickets
- #17
- #21 (visibility only; not a full fix)

## Dependencies
- Depends on current homepage/privacy behavior being stable enough to test.
- Can run in parallel with Plan 1.
- Should ideally land before or alongside large componentization work so it becomes a safety net for Plan 3.

## Preconditions
- `npm ci`, `npm run build`, and `npm run preview` already work locally.
- Playwright is already present in `devDependencies`.

## Files or subsystems likely affected
- `package.json`
- `playwright.config.*` (new)
- `tests/` or `playwright/` test files (new)
- `lighthouserc.*` (new)
- `.github/workflows/ci.yml`
- optional helper files under `src/` only if selectors/hooks need a minimal stabilization tweak

## Implementation steps
1. Add Playwright configuration with a local preview-backed `webServer` and stable `baseURL`.
2. Create a small smoke suite covering homepage load, privacy page load, and at least one critical interactive flow (Upwork modal open/close or equivalent stable interaction).
3. Add `@axe-core/playwright` accessibility assertions for the key pages/regions.
4. Add test scripts in `package.json` for browser smoke coverage and CI usage.
5. Add Lighthouse CI configuration for the current important public URLs.
6. Extend the GitHub Actions workflow to run the browser test and Lighthouse steps in a CI-safe order.
7. Keep thresholds/assertions strict enough to catch real regressions but not so brittle that content edits create constant noise.

## Verification steps
- `npm install` (if new test deps are added)
- `npx playwright test`
- `npm run check`
- `npm run build`
- `npx lhci autorun` or the repo-defined Lighthouse command
- Validate CI YAML syntax by re-reading the final workflow and confirming step order / Node version / artifacts

## Done-when checklist
- Playwright config exists and runs against local preview.
- Smoke tests exist for homepage, privacy, and a core interaction.
- Axe accessibility scan is part of the Playwright suite.
- Lighthouse CI config exists and is wired into CI.
- CI workflow runs the new QA gates without undoing current build/check behavior.
- Browser QA can run without requiring private tokens or external authenticated APIs.

## Parallel
- Yes

## Risks / notes
- Lighthouse can get noisy; keep the first pass to sane release gates rather than impossible budgets.
- Accessibility automation is not a substitute for manual UAT; preserve that distinction in docs.
