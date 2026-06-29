# Phase 02 — Plan 1: homepage conversion and copy cleanup

## Objective

Make the homepage easier to hire from by clarifying the primary CTA, adding an offer/process section, and removing jargon-heavy or misleading proof framing.

## Tickets

- #9
- #10
- #11
- #22 (copy/markup side)

## Files

- Modify: `src/pages/index.astro`
- Modify: `src/components/UpworkPortfolioCard.astro`
- Modify: `src/styles/global.css`
- Modify: `README.md` (supporting wording consistency if touched by the same copy pass)

## Planned changes

1. Reduce hero CTA clutter so one contact path reads as primary.
2. Remove or demote distracting secondary surfaces from the hero.
3. Replace "developer lab" / "proof surface" / similar copy with client-facing wording.
4. Add a clear services / "how we start" section using existing truthful work categories.
5. Remove arbitrary percentage-bar proof UI.
6. Remove duplicate mobile proof-stack markup.
7. Rename Upwork modal/button copy to something less forensic and more client-friendly.
8. Move sponsor/support content lower in the journey and mark it clearly optional.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npx prettier --check src/pages/index.astro src/components/UpworkPortfolioCard.astro src/styles/global.css README.md`
- `npm run build`

## Done When

- Homepage reads like a client-facing offer, not an internal dashboard.
- There is one clear hero CTA path.
- A buyer can see what Ahmed builds and how engagement starts without hunting.
- Arbitrary percentage bars and duplicate live proof regions are gone.
- Sponsor/support links no longer compete with the hire path.

## Parallel

- No
