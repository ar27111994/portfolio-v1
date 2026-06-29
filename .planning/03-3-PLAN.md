# Phase 03 — Plan 3: homepage componentization, data extraction, and script extraction

## Objective
Refactor the monolithic homepage into maintainable Astro section components, extract static content data into clear modules, and move the page interaction logic into a bundled local script without changing the user-facing information architecture.

## Related requirements
- REQ-05
- REQ-21
- REQ-07 (indirectly, by making the branch safer to verify and maintain)

## Related tickets
- #15

## Dependencies
- Depends on Phase 02 homepage strategy remaining binding.
- Benefits from Plan 2 landing first so there is automated smoke coverage during the refactor.
- May overlap partially with Plan 1, but should not race on README/CI files.

## Preconditions
- `03-CONTEXT.md` remains binding: no broad redesign, no change in factual posture, no new framework.
- Existing homepage section ids/anchors should be treated as stable unless there is a compelling accessibility reason to change them.

## Files or subsystems likely affected
- `src/pages/index.astro`
- `src/components/home/*.astro` (new)
- `src/data/*.ts` modules for homepage content (new)
- `src/scripts/*` or another local `src/` script module (new)
- `src/styles/global.css` and/or extracted section styles if the refactor benefits from cleaner organization

## Implementation steps
1. Identify coherent homepage section boundaries and group the large static arrays by concern.
2. Extract static content into typed data modules while preserving current text and evidence links.
3. Create section-level Astro components for the major homepage blocks.
4. Refactor `src/pages/index.astro` into a thinner composition shell that imports data/modules/components.
5. Move the large inline homepage script into a local bundled script/module under `src/`, preserving current navigation/modal/feed behaviors and ClientRouter re-init behavior.
6. Reduce any now-obsolete duplicated or overly global CSS where safe, without turning the phase into a visual redesign.
7. Re-run the full checks and browser smoke coverage to confirm parity.

## Verification steps
- `npm run check`
- `npm run build`
- `npx playwright test`
- targeted browser readback confirming key section ids/headings still exist
- `npx prettier --check src/pages/index.astro src/components/home src/data src/scripts src/styles/global.css`

## Done-when checklist
- `src/pages/index.astro` is substantially thinner and primarily composes imported sections.
- Large homepage data structures live outside the page in typed modules.
- Homepage client-side logic is no longer a large inline page script.
- Existing major user-visible content/anchors still work after the refactor.
- Build/check/browser smoke tests pass after the refactor.

## Parallel
- No

## Risks / notes
- This is the easiest Phase 03 task to accidentally let sprawl; keep it strictly about maintainability, not redesign.
- Preserve stable ids/selectors where possible so new QA tests stay useful.
