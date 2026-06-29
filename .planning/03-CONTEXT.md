# Phase 03 Context — maintainability, automated QA, and OSS/release polish

## Phase scope summary
This Phase 03 slice covers the remaining repo-backed website/release-engineering tickets before the resume rebuild wave. The focus is tickets `#15`, `#17`, and `#19`, plus the closely related follow-ups `#16`, `#23`, and `#26`.

This is intentionally a website/repo maintenance slice, not the resume implementation slice. Resume tickets `#28-39` remain in Milestone 1 scope but are explicitly deferred to the next sub-slice so this phase can stay atomic and reviewable.

## User vision and priorities
- Leave the branch looking like a maintained, serious engineering repo — not just a nice landing page.
- Favor correctness, maintainability, and testability over cleverness or churn.
- Preserve the premium, restrained visual tone established in Phase 02.
- Do not reopen already-settled copy/proof decisions unless a maintainability change forces it.
- Keep all claims truthful and verifiable; do not add marketing theater just because Phase 03 includes polish work.
- Prefer upstream-supported, production-grade solutions over hacks, overrides, or compatibility shims.

## UI decisions
- Dark mode is acceptable in this phase, but it should be implemented as a calm `prefers-color-scheme` theme first — not a flashy personalization feature.
- No broad information-architecture rewrite: the homepage sections and major ids/anchors should remain stable.
- Case studies, testimonials, and proof content already shipped in Phase 02 should keep the same factual posture.
- Any visual polish in this phase should make the site feel more coherent, not more complicated.

## Technical decisions
- Use Astro-native decomposition: extract homepage sections into `.astro` components and move large static data arrays into typed modules under `src/data/` or an equivalent, obvious home under `src/`.
- Extract the page-level inline homepage script into a bundled local script/module under `src/` so it is easier to test and maintain.
- Keep the existing no-framework approach. Do not introduce React/Vue/Svelte just to split the page.
- Add automated QA with Playwright plus `@axe-core/playwright`, and add Lighthouse CI for a lightweight release-quality budget check.
- Keep CI pinned to the existing Node `22.12.0` line and extend the current workflow rather than replacing it.
- Treat issue `#21` as a visibility/monitoring concern in this phase, not a promise that all upstream advisories will be cleared locally.

## Data model decisions
- No new backend or persistence model is required for this phase.
- Existing homepage content arrays should be split by concern into maintainable modules (for example: proof/case studies, contact/resume/profile links, feed sources, service blocks).
- Preserve the current Upwork build/runtime data flow; do not redesign the `src/data/upwork-portfolio.json` snapshot system during this phase.

## Performance expectations
- Componentization must not add unnecessary client JavaScript or duplicate event wiring.
- The extracted script should preserve current behavior for ClientRouter/View Transitions and modal/open-close flows.
- Automated tests should be CI-friendly and bounded — smoke/a11y/perf coverage is the goal, not a huge flaky suite.
- Dark mode and metadata improvements must not materially slow the site or create new runtime dependencies.

## Edge cases to prioritize
- Homepage section anchors, aria labels, and proof-related ids should survive component extraction unchanged wherever practical.
- Extracted client-side code must still re-run correctly after Astro ClientRouter navigations.
- Playwright tests must not depend on private tokens or fragile external APIs.
- Lighthouse thresholds should be strict enough to catch regressions, but not so brittle that normal content edits create noise.
- Upwork modal videos may not have narration; if so, document/encode the "captions not applicable" posture instead of faking a captions feature.
- Dark mode must preserve readable contrast across all major panels and chips.

## Explicit non-goals for this phase
- No resume generator changes or PDF rebuilds in this slice.
- No LinkedIn/manual ticket work.
- No new pages for case studies/blog/docs beyond what already exists.
- No unsupported dependency hacks just to force issue `#21` closed.
- No visual redesign that reopens the core Phase 02 homepage strategy.

## Open questions
- Whether a manual dark-mode toggle is worth it, or whether `prefers-color-scheme` alone is sufficient for this milestone.
- Whether any Upwork modal videos actually contain speech/narration that would require caption tracks instead of a documented N/A outcome.
- Whether Lighthouse CI should run against a static `dist/` audit flow or an Astro preview server flow in CI for the most stable results.
