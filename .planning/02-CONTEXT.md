# Phase 02 Context — conversion, credibility, and performance cleanup

## Intent

Phase 02 should make the portfolio easier to hire from, less dashboard-like, and less dependent on fragile runtime fetches. The goal is not to make the page louder; it is to make it clearer, calmer, and more credible.

## User-facing choices locked for this phase

- Keep the site premium, restrained, and professional.
- Prefer one clear hire path over many competing calls-to-action.
- Do not fabricate testimonials, partner status, metrics, or outcomes.
- If proof is weak or unverifiable, soften the claim or move it lower in the page.
- Prefer static or build-time truth over noisy client-side "live" theatrics.
- Preserve the Upwork / resume / public-profile surfaces, but de-emphasize anything that distracts from the primary hiring path.

## Phase focus

1. Rewrite high-traffic homepage copy so it reads like a client-facing service site, not a personal telemetry dashboard.
2. Add a clear services / engagement-start section.
3. Remove arbitrary percentage bars and proof-surface jargon.
4. Reduce runtime fragility by removing unauthenticated GitHub browser fetches.
5. Self-host Inter and clean up a few obvious performance / SEO / mobile-nav issues.

## Explicit non-goals for this phase

- No invented testimonials or review quotes.
- No resume-generator rebuild yet unless required by a repo-backed ticket in this phase.
- No broad component extraction / architecture refactor yet.
- No LinkedIn/manual tickets.

## Evidence sources allowed

- Existing repo content.
- Existing Upwork portfolio JSON snapshot.
- Existing public profile links already present in the repo.
- Official Astro/font docs for implementation details.

## Quality bar

- Any conversion copy change must stay truthful.
- Any proof/metrics surface kept on the page must be defensible from local artifacts or public links.
- Any performance improvement must not break the current Astro/Vercel deployment model.
