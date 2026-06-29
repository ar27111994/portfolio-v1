# Phase 02 Fix Plan — stabilize generated Upwork snapshot formatting and git cleanliness

## Failed Deliverable
- `npm run check` should pass after Phase 02 verification without a generated-file formatting regression.

## Observed Behavior
- `npm run check` fails because `src/data/upwork-portfolio.json` is rewritten during build with formatting that no longer matches Prettier expectations.
- The current build flow also dirties the working tree even when only metadata timestamps change.

## Expected Behavior
- The build-time Upwork snapshot writer should emit consistently formatted JSON.
- It should avoid rewriting the committed snapshot when the merged portfolio payload has not materially changed.
- `npm run check` should pass after `npm run build`.

## Likely Root Cause
- `scripts/fetch-portfolio-build.mjs` writes `src/data/upwork-portfolio.json` unconditionally with `JSON.stringify(..., null, 2)` and no trailing newline.
- The script also updates `extractedAt` on every build, causing needless git churn even when the actual snapshot data is unchanged.

## Files / Subsystems Involved
- `scripts/fetch-portfolio-build.mjs`
- `src/data/upwork-portfolio.json`

## Repair Steps
1. Make the snapshot writer emit newline-terminated JSON so formatting stays stable.
2. Detect the "timestamp only" case and preserve the existing committed snapshot instead of rewriting it.
3. Re-run formatting on `src/data/upwork-portfolio.json` once.
4. Re-run `npm run build` and `npm run check` to verify the regression is gone.

## Verification Steps
1. `npm run build`
2. `npm run check`
3. `git status --short`

## Done When
- `npm run check` passes after a fresh build.
- `src/data/upwork-portfolio.json` is not rewritten when only `extractedAt` would change.
- The generated JSON is newline-terminated and Prettier-clean.
