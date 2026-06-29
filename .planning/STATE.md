# Project State — portfolio-v1 release batch

## Current Position

- Milestone: 1
- Phase: 2
- Status: Phase 01 implemented and verified; Phase 02 implemented and verified locally; push/handoff cleanup is next.
- Branch: `feat/live-deployment-open-tickets`
- Last completed workflow: `verify-work 02`
- Next: reconcile remaining open audit tickets (#14 wording, #21 residual dependency note), then push branch and prepare milestone handoff.

## Active Decisions

- Repo-actionable scope is website/repo tickets #1-27, #55, #57 plus resume tickets #28-39.
- LinkedIn tickets #40-51 are external/manual and will be documented, not falsely marked as implemented in-repo.
- Unverified partner/testimonial/metric claims must be softened or removed instead of embellished.
- Resume PDFs must be regenerated from `C:\Users\ar271\AppData\Local\hermes\workspace\build_v3.py`.
- Priority order is P0 trust/security/accessibility first, then conversion/proof/perf, then refactor/tests/polish.
- Phase 01 is considered complete: `01-1`, `01-2`, and `01-3` all shipped and passed verification/UAT.
- Phase 02 will prioritize repo-backed conversion/performance issues before the resume rebuild phase.
- Keep proof/copy truthful and calm; reduce runtime theatrics instead of adding more live widgets.

## Blockers

- Upwork public profile is anti-bot protected, so live scraping remains unreliable; testimonial proof now uses user-supplied review text plus canonical source URLs instead of depending on runtime scraping.
- Remaining dependency advisories are now narrowed to 2 transitive packages (`js-yaml`, `esbuild`) after the Astro upgrade, but they are not fully cleared because upstream toolchain packages still resolve vulnerable ranges.
- Some external/manual tickets cannot be completed from this repo alone and must be captured as follow-up.

## Evidence / Notes

- `.planning/` was initialized during this session and replaced with project-specific content.
- Branch already exists from latest `main`: `feat/live-deployment-open-tickets`.
- Open-ticket backlog was classified from GitHub issues #1-57.
- Phase 01 verification is recorded in `01-VERIFICATION.md` and Phase 01 UAT passed in `01-UAT.md`.
- `npm audit --omit=dev --json` is now down to 3 advisories total: 2 low (`astro`/`esbuild`) and 1 moderate (`js-yaml`).

## Pending Artifacts

- Phase 02 implementation summaries / verification notes
- Resume-phase planning notes once Phase 02 repo-backed website work lands
- Final handoff for manual LinkedIn items

## Next Recommended Command

- Execute Phase 02: implement and commit homepage conversion/copy cleanup first (#9, #10, #11, #22), then runtime/perf cleanup (#12, #13, #20, #24, #26, #27, partial #18).
