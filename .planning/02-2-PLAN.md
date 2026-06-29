# Phase 02 — Plan 2: performance, runtime reliability, and metadata cleanup

## Objective

Reduce avoidable runtime cost and fragility by self-hosting Inter, removing unauthenticated GitHub browser fetches, and cleaning up obvious metadata/mobile-nav issues.

## Tickets

- #12
- #13
- #20
- #24
- #26
- #27
- #18 (README stale-reference portion)

## Files

- Modify: `package.json`
- Modify: `astro.config.mjs` (only if needed for font config)
- Modify: `src/layouts/Layout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

## Planned changes

1. Replace Google-hosted Inter with a self-hosted package.
2. Remove client-side GitHub stats/feed fetches that can 403 or spam consoles.
3. Update page copy to reflect build-time/static metrics where applicable.
4. Remove or reduce DOM/UI structures that existed only to support the old live-proof presentation.
5. Normalize obvious font-weight overspecification.
6. Drop `background-attachment: fixed` and add a visible mobile-nav scroll affordance.
7. Remove `meta keywords`, soften `og:locale`, and align CI Node version with the engine floor.
8. Fix stale README references discovered during the audit.

## Verification

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npx prettier --check package.json astro.config.mjs src/layouts/Layout.astro src/pages/index.astro src/styles/global.css .github/workflows/ci.yml README.md`
- `npm run build`
- `npm audit --omit=dev --json`

## Done When

- No Google Fonts stylesheet remains.
- No unauthenticated GitHub API browser fetch remains.
- Mobile nav has a visible scroll affordance.
- Metadata/CI/readme cleanup is reflected in code and docs.
- Build/type/lint/format checks pass after the dependency change.

## Parallel

- No
