# Phase 03 — Plan 1: community-health docs and remaining metadata polish

## Objective
Ship the missing OSS/community-health files and finish the low-risk repo-shell polish so the portfolio branch reads like a maintained software project, not just a deployed marketing surface.

## Related requirements
- REQ-05
- REQ-07
- REQ-20 (partial support via clearer documentation posture)

## Related tickets
- #19
- #26 (remaining realistic scope only)

## Dependencies
- Depends on Phase 02 being complete enough that README/documentation can reflect the current product truth.

## Preconditions
- Current website branch remains the source of truth for shipped behavior.
- Existing `SECURITY.md` is kept and not reworked unnecessarily.

## Files or subsystems likely affected
- `README.md`
- `CONTRIBUTING.md` (new)
- `CODE_OF_CONDUCT.md` (new)
- `.github/` templates if needed
- `src/layouts/Layout.astro` if minimal remaining metadata polish is implemented now

## Implementation steps
1. Audit current README for outdated stack/version/documentation language and badge opportunities.
2. Add `CONTRIBUTING.md` with practical local-dev, verification, and PR expectations specific to this repo.
3. Add `CODE_OF_CONDUCT.md` using a standard, maintainable community template with minimal project-specific edits.
4. Add README badges for CI and license using the actual repo/workflow details.
5. Reconcile the README stack/deploy text with the actual current repo state (Astro 7, current trust/policy files, actual project structure).
6. Finish the realistic remainder of #26 without inventing fake page architecture; if breadcrumb/per-page OG work should stay deferred, document that boundary clearly.
7. Run formatting/checks and verify docs/metadata still build cleanly.

## Verification steps
- `npx prettier --check README.md CONTRIBUTING.md CODE_OF_CONDUCT.md src/layouts/Layout.astro`
- `npm run check`
- `npm run build`
- Manual readback of README top sections to confirm stack/version/policy/project-structure accuracy

## Done-when checklist
- `CONTRIBUTING.md` exists and is specific to this repo.
- `CODE_OF_CONDUCT.md` exists.
- README shows real CI/license badges.
- README no longer contradicts the actual current stack or file structure.
- Any remaining #26 work is either implemented or explicitly bounded without pretending it shipped.
- Build and check pass.

## Parallel
- Yes

## Risks / notes
- Easy to over-document or add generic OSS boilerplate; keep it practical.
- Badge URLs must be correct and not point to stale workflow names/branches.
