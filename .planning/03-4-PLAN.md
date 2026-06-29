# Phase 03 — Plan 4: dark mode, accessibility/media follow-ups, and final polish hooks

## Objective
Add a restrained dark theme, resolve the remaining low-risk accessibility/media follow-up around modal video captions, and finish the last polish hooks needed for a cleaner release-engineering baseline.

## Related requirements
- REQ-05
- REQ-07

## Related tickets
- #16
- #23
- #26 (if any small remainder is left after Plan 1)

## Dependencies
- Depends on the current visual system remaining stable.
- Safer after Plan 3 if selector/component changes are significant, but can be implemented after or alongside it as long as verification is repeated.

## Preconditions
- The site’s current light theme remains the baseline and must continue to look premium.
- Any caption decision must be based on actual current media usage, not guesswork.

## Files or subsystems likely affected
- `src/styles/global.css`
- `src/layouts/Layout.astro`
- `src/components/UpworkPortfolioCard.astro`
- possibly small supporting docs if the caption outcome is "not applicable" and should be recorded

## Implementation steps
1. Add a `prefers-color-scheme: dark` theme using the existing token system and update metadata to advertise both light/dark support.
2. Review current Upwork modal media behavior and determine whether captions are actually required for the existing assets.
3. If current videos are non-verbal/visual-only, encode/document the N/A resolution cleanly; if narration exists, add the real caption-track support path.
4. Finish any small remaining metadata/SEO polish that still belongs to #26 after Plan 1.
5. Re-run automated checks plus browser/manual spot verification in both light and dark contexts where practical.

## Verification steps
- `npm run check`
- `npm run build`
- `npx playwright test`
- browser/manual verification of homepage and modal in dark mode
- targeted accessibility review for contrast-sensitive surfaces

## Done-when checklist
- Dark mode exists via `prefers-color-scheme` and does not degrade readability.
- `color-scheme` metadata reflects the supported modes.
- Ticket #23 is resolved honestly (real caption support or documented non-applicability).
- Any tiny remaining #26 polish is finished or explicitly documented as deferred.
- Checks/tests/build pass after the polish changes.

## Parallel
- No

## Risks / notes
- Dark mode can easily become aesthetic churn; keep it simple and token-driven.
- Do not fake accessibility compliance for captions if the asset truth is different.
