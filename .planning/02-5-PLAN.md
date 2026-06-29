# Phase 02 — Plan 5: dependency advisory remediation

## Objective

Reduce the remaining production dependency advisories without inventing security claims or leaving the repo in a half-upgraded state.

## Tickets

- #21

## Files

- Modify: `package.json`
- Modify: `package-lock.json`
- Update: `.planning/STATE.md`
- Update: `.planning/02-RESEARCH.md`

## Planned changes

1. Upgrade the smallest set of production dependencies needed to reduce or eliminate the remaining advisory surface.
2. Prefer supported upstream versions over local workarounds or overrides.
3. Re-run lint, typecheck, build, and `npm audit --omit=dev --json` after the upgrade.
4. Record the exact post-upgrade advisory state and whether anything remains blocked by upstream semver constraints.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm audit --omit=dev --json`
- Browser smoke check on the homepage after the dependency update

## Done When

- Package versions are updated in a supported way.
- The site still builds and typechecks cleanly.
- Production audit state is measurably improved or the remaining blocker is explicitly documented.
- No compatibility hacks or ad-hoc resolution overrides are introduced.

## Parallel

- No
