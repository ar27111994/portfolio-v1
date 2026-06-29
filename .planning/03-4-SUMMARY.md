# Phase 03 — Plan 4 Summary

## Objective
Add a restrained dark-mode path, update color-scheme metadata honestly, resolve the modal-video captions question based on the actual live asset, and close the remaining low-risk SEO follow-up that still belonged in this slice.

## What changed
- Updated layout metadata in `src/layouts/Layout.astro`:
  - `theme-color` now declares separate light and dark values.
  - `color-scheme` now advertises `light dark`.
  - `og:locale` remains `en_US`, which already matches the ticket’s preferred broader/global default.
- Added a token-driven dark theme in `src/styles/global.css`:
  - dark-token overrides via `@media (prefers-color-scheme: dark)`.
  - explicit `:root[data-theme="dark"]` support so dark styling can also be forced in testing/manual inspection.
  - dark styling for shell surfaces, cards, rails, modal chrome, chips, footer links, and proof/contact surfaces.
- Resolved ticket `#23` honestly in `src/components/UpworkPortfolioCard.astro`:
  - verified that the `agent-harness` demo video contains spoken narration.
  - replaced the narrated YouTube-backed modal preview with a caption-capable embedded YouTube iframe instead of a raw `<video>` element with no tracks.
  - added explicit copy telling users captions are available in the embedded player controls.
  - kept fallback handling for non-YouTube video assets.
- Strengthened smoke coverage in `tests/smoke.spec.ts`:
  - verifies `color-scheme` and dark `theme-color` metadata.
  - verifies a dark-preference render path applies dark tokens.
  - verifies the `agent-harness` modal opens and exposes the caption-capable embedded video path.

## Asset-truth findings for #23
- Source issue asked for either real caption support or a documented non-applicability decision.
- I fetched the transcript for `https://youtu.be/u1OmcS97iOg` and confirmed spoken narration is present.
- Because narration exists, "captions not applicable" would be false.
- The clean fix in this repo is to embed the caption-capable YouTube player for that narrated asset and state that captions are available in-player.

## #26 remainder status
- `meta keywords` is already absent from `src/layouts/Layout.astro`, so that dated SEO surface is already cleaned up.
- `og:locale` is already `en_US`, which matches the more global recommendation from the issue.
- `BreadcrumbList` / per-page OG image work is still logically tied to future deeper page expansion (e.g. case-study pages) and remains a truthful defer, not something to fake inside the current two-page surface.

## Verification
Executed successfully:
- `npm run check`
- `npm run build`
- `npm run test:smoke`
- `npm run test:lighthouse`

Observed results:
- Smoke tests: 6 passed.
- Lighthouse assertions:
  - homepage accessibility: pass
  - homepage SEO: pass
  - homepage performance: warning (`0.37`, visible but non-blocking)
  - privacy accessibility: pass
  - privacy SEO: pass
  - privacy performance: pass (`0.95`)
- The custom Lighthouse runner again tolerated the known Windows Chrome temp-dir cleanup EPERM after reports were already written.

## Notes / caveats
- Browser snapshotting in the local browser tool still rendered the visible page in light mode because the browser environment reported a light preference by default; dark mode was therefore verified via metadata, CSS token activation under emulated dark preference, and automated smoke assertions rather than by trusting that light-mode snapshot.
- No claim is made that all possible media assets now carry standalone VTT tracks. The truthful claim is narrower: the currently narrated YouTube-backed demo now uses a caption-capable player path and is represented as such in the UI.
