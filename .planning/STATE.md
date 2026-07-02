# Project State — portfolio-v1 release batch

## Current Position
- Milestone: 1
- Phase: 4 — COMPLETE
- Status: Milestone 1 is ready for completion. All 57 tickets resolved. All 4 phases executed, verified, and committed. All repo checks pass (check, build, smoke 6/6, Lighthouse).
- Branch: `feat/live-deployment-open-tickets`
- Last completed workflow: milestone-close (all issues closed, audit refreshed, commits pushed)
- Next: merge `feat/live-deployment-open-tickets` into `main`, deploy to Vercel, then run `complete-milestone` to archive and tag.

## Active Decisions
- Phase 03 remains closed as the repo-backed website slice; Phase 04 owns the deferred resume backlog plus the explicit manual/external handoff.
- Resume changes remain generator-first through `C:\Users\ar271\AppData\Local\hermes\workspace\build_v3.py`; no manual PDF surgery.
- Final public resume topology:
  - `resume_full.pdf` = full-depth, photo-free, ATS-safer 3-pager
  - `resume.pdf` = ATS-default condensed version
  - `resume_client_freelance.pdf` = client-facing delivery proof
  - `resume_one_page.pdf` = fast-scan variant
- Unsupported partner-style claims remain softened unless verifiable proof is added later.

## Blockers / Concerns
- Homepage Lighthouse performance (0.44 vs ≥0.5) — documented caveat, not a correctness issue. All smoke tests pass, site loads correctly.
- Two transitive dependency advisories remain upstream (esbuild low, js-yaml moderate) — documented as TD-01.
- The canonical resume generator is outside the repo, so repo history cannot fully capture that source diff.

## Evidence / Notes
- All 4 phases executed and verified:
  - Phase 01: trust/legal/security — `01-VERIFICATION.md`, `01-UAT.md`
  - Phase 02: homepage conversion/runtime — `02-VERIFICATION.md`, `02-UAT.md`
  - Phase 03: maintainability/testing/polish — `03-VERIFICATION.md`, `03-UAT.md`
  - Phase 04: resume rebuild + external handoff — `04-VERIFICATION.md`, `04-EXTERNAL-HANDOFF.md`
- Regenerated PDFs have explicit metadata plus tagged structure confirmed via `pypdf`.
- All 57 GitHub issues resolved (44 completed, 13 external/manual with handoff).
- Repo verification results:
  - `npm run check` → pass
  - `npm run build` → pass
  - `npm run test:smoke` → 6/6 pass
  - `npm run test:lighthouse` → completed, homepage perf warning noted

## Commit History (Phase 04)
- `8f96421` feat(resume): rebuild all variants from canonical generator (#28-39)
- `a509c5e` feat(site): update resume download surface to 4 variants
- `ff23b8e` test: add smoke assertion for ATS resume download link
- *(upcoming)* docs: refresh milestone audit and state for closeout

## Next Recommended Command
- Verify the branch with a final `npm run check && npm run build && npm run test:smoke`, then push to remote and open a PR from `feat/live-deployment-open-tickets` to `main`.
