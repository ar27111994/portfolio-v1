# Phase 03 Research — maintainability, automated QA, and OSS/release polish

## Tickets mapped into this phase
- #15 — Componentize `index.astro`; move data to `src/data`; extract inline script
- #17 — Add Playwright + axe + Lighthouse-CI tests
- #19 — Add `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / README badges
- #16 — Add dark mode (`prefers-color-scheme`)
- #23 — Add captions track to modal video previews, or confirm not required
- #26 — Remaining SEO polish: breadcrumbs / per-page OG follow-up strategy
- #21 (related only) — keep residual dependency risk visible in CI/process, but do not promise a local full fix

## Implementation patterns

### 1) Astro-native decomposition is the right maintainability move
Repo state confirms the homepage is still monolithic:
- `src/pages/index.astro` ≈ 2188 lines
- `src/styles/global.css` ≈ 3159 lines
- `src/components/` contains only `UpworkPortfolioCard.astro`

Astro docs support extracting reusable `.astro` components and importing local scripts under `src/` so they are bundled and deduplicated automatically. That means we can split section markup without introducing a client framework and move the current page-level inline script into a local file/module while keeping Astro’s bundled script behavior.

Best-fit split for this phase:
- layout shell remains in `src/pages/index.astro`
- section components under `src/components/home/` (hero, services, case studies, featured projects, feed, testimonials, proof, contact, support, etc.)
- static content modules under `src/data/` grouped by concern
- extracted homepage interaction script under `src/scripts/` or equivalent local `src/` path

### 2) CI-friendly QA should be smoke-first, not exhaustive
Current repo has Playwright installed but no tests, config, or CI use. The strongest low-risk move is:
- add Playwright config with `webServer` and `baseURL`
- run local preview (`npm run preview`) in tests
- add a small smoke suite for homepage + privacy + modal interaction
- add `@axe-core/playwright` scans for whole-page/accessibility smoke coverage
- add Lighthouse CI with a static-site or preview-driven audit for `/` and `/privacy`

This matches REQ-05 and REQ-07 without overbuilding a flaky suite.

### 3) OSS/community-health files should be lightweight and pragmatic
`SECURITY.md` already exists, so #19 scope should be narrowed to what is still missing:
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- README badges
- optionally issue/PR templates if they fit naturally, but the ticket wording only strictly requires the first three plus badges

Documentation should reflect current repo reality, not aspirational community theater.

### 4) Dark mode should be variable-driven and restrained
Current `Layout.astro` explicitly sets `color-scheme` to `light`, and there are no dark-mode media queries in the CSS. Because the site already uses a strong variable-driven design system, the least risky pattern is:
- extend root CSS tokens
- add `@media (prefers-color-scheme: dark)` overrides
- update `<meta name="color-scheme">` to support both light and dark
- avoid a JS toggle unless manual testing proves the passive approach inadequate

### 5) Ticket #23 likely resolves as documented N/A unless narrated media exists
The audit issue is conditional: only narrated/speech-heavy videos actually require captions for WCAG 1.2.2. The safest Phase 03 move is to inspect the existing video sources/usage and, if they are purely visual demo/screencapture media, document that captions are not applicable and ensure the implementation doesn’t imply otherwise. If narration exists, that becomes real asset work rather than a markup-only patch.

### 6) Ticket #26 should be scoped honestly
Part of #26 is already completed:
- `meta keywords` removed
- `og:locale` moved to `en_US`

Remaining realistic scope for this phase:
- document and/or implement `BreadcrumbList` / per-page OG follow-up only where it makes sense for the existing two-page site
- avoid inventing a page architecture that does not yet exist just to satisfy the ticket text literally

## Libraries / APIs research

### Playwright
- Official docs support `webServer` + `baseURL` in config for local preview-backed testing.
- Reporter combinations like `html`, `junit`, and `github` are supported and CI-friendly.
- The repo already has `playwright` in `devDependencies`, so this is an incremental setup.

### `@axe-core/playwright`
- Official guidance supports full-page scans via `new AxeBuilder({ page }).analyze()`.
- Can attach scan JSON artifacts for debugging.
- Best used as smoke coverage, not a full substitute for manual accessibility review.

### Lighthouse CI
- Official docs support GitHub Actions integration and `lhci autorun`.
- Static-site and local preview/server-backed configs are both supported.
- For this Astro site, a preview/static audit on built output should be stable enough.

### Astro client-side script handling
- Astro processes local scripts in `src/` with bundling and deduplication.
- `is:inline` disables processing and duplicates raw script content if reused.
- That supports extracting the current homepage inline script into a local script file and importing it in a processed script tag.

## Existing codebase patterns to preserve
- Keep Astro-only rendering model.
- Keep data-first section rendering via arrays/maps; just relocate the arrays into clearer modules.
- Keep `UpworkPortfolioCard.astro` as the modal/detail component boundary.
- Preserve existing section ids and accessibility hooks where they already work.

## Edge cases / gotchas
- Script extraction must preserve current `astro:page-load` behavior for ClientRouter navigations.
- Component extraction can easily break section ids/anchor targets if renamed carelessly.
- Lighthouse CI can be noisy if thresholds are unrealistic or if the preview/build path is unstable.
- Dark mode can quietly break contrast on chips, cards, borders, and muted metadata if only the obvious tokens are updated.
- README currently still says “Astro 6” even though the actual dependency is `astro ^7.0.3`; Phase 03 doc polish should correct that.
- Because `.planning/` is gitignored, any Phase 03 plan/summaries that should be preserved in git will need force-add just like earlier phases.

## Phase planning recommendations
- Plan 1 should cover repo/community-health docs + remaining SEO/metadata cleanup because they are documentation-shell work with little code risk.
- Plan 2 should cover automated QA infrastructure (Playwright + axe + Lighthouse CI).
- Plan 3 should cover homepage componentization/data extraction/script extraction.
- Plan 4 should cover dark mode plus the captions-track/N-A resolution and any resulting verification cleanup.

## Open questions to preserve into planning
- Whether to keep dark mode passive (`prefers-color-scheme`) or add a manual toggle later.
- Whether any modal video assets contain narration requiring real caption tracks.
- Whether to audit Lighthouse against static `dist/` only or preview server URLs in CI.
