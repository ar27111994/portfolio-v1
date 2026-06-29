# Phase 02 — Plan 5 Summary: dependency advisory remediation

## Plan Reference
- `02-5-PLAN.md`

## Objective
- Reduce the remaining production dependency advisories without inventing security claims, unsupported overrides, or fake green status.

## What Changed
- Upgraded `astro` from `^6.4.6` to `^7.0.3`.
- Upgraded `@astrojs/sitemap` from `^3.7.2` to `^3.7.3`.
- Updated `package-lock.json` to the new supported dependency graph.
- Hardened `scripts/fetch-portfolio-build.mjs` so timestamp-only Upwork refreshes no longer dirty `src/data/upwork-portfolio.json` during build-time fetches.

## Verification Performed
- `npm run build`
- `npm run check`
- `npm audit --omit=dev --json`
- local browser verification against homepage and privacy page after the dependency update

## Results
- `npm run build` passed.
- `npm run check` passed.
- Browser checks still showed the homepage and privacy page rendering correctly with no captured homepage JS errors.
- Production audit state improved from the older issue snapshot of 4 production advisories down to 2 remaining transitive advisories.

## Remaining Risk / Honest Status
- The remediation is partial, not complete.
- Remaining advisories:
  - `js-yaml@4.1.1` — moderate
  - `esbuild@0.27.x` in upstream toolchain paths — low
- These are still present because supported upstream packages in the current toolchain (`astro` / `@vercel/node`) continue to resolve them transitively.
- No local override/resolution hacks were introduced to fake a clean audit.

## Ticket Impact
- `#21` is still open, but its scope is narrowed and accurately updated with the current verified audit state.
