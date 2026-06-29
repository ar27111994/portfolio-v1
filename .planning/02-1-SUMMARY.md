# Phase 02 — Plan 1 Summary: homepage conversion and copy cleanup

## Plan Reference

- `02-1-PLAN.md`

## Objective

- Make the homepage easier to hire from by clarifying the primary CTA, adding a clear services/process section, and removing jargon-heavy or distracting proof presentation.

## What changed

- Simplified the hero contact cluster so email is the primary CTA and resume becomes a secondary text path instead of a co-equal button.
- Rewrote the hero lede to describe actual client-facing value: devtools, webhook/API workflows, automation, and AI-agent systems.
- Removed the duplicate mobile proof-stack block instead of keeping two live proof regions in sync.
- Reframed the hero snapshot from "live proof stack" into a calmer public-work snapshot.
- Removed the arbitrary percentage-bar proof UI and extra icon theatrics.
- Rewrote the "Developer lab" section into a buyer-facing "What I build" services section.
- Added a new "How we start" engagement section with three concrete steps.
- Reworded profile/support/proof sections to sound like supporting evidence, not dashboard telemetry.
- Moved sponsorship framing lower and made it explicitly optional / separate from hiring.
- Renamed Upwork card/modal affordances from forensic language ("Inspect Upwork record", "Captured Upwork record") to friendlier project-detail wording.

## Files changed

- `src/pages/index.astro`
- `src/components/UpworkPortfolioCard.astro`
- `src/styles/global.css`
- `.planning/02-RESEARCH.md`

## Verification run

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npx prettier --check src/pages/index.astro src/components/UpworkPortfolioCard.astro src/styles/global.css README.md .planning/02-RESEARCH.md` ✅
- `npm run build` ✅

## Notes

- Build still refreshes `src/data/upwork-portfolio.json` during `prebuild`; that file remains dirty until we decide whether to keep or revert the refreshed snapshot before commit.
- Testimonials/case-study copy remains deferred until evidence is curated from Upwork/LinkedIn or supplied manually with URLs.
