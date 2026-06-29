# Contributing

Thanks for contributing to `portfolio-v1`.

This repo is both a live portfolio site and a working engineering artifact, so the bar is a little higher than “looks fine on my machine.” Changes should stay truthful, maintainable, and verifiable.

## Ground rules

- Keep claims factual. If proof is weak, soften the copy instead of inventing confidence.
- Prefer upstream-supported solutions over hacks or local compatibility shims.
- Preserve the calm, premium design tone already established in the site.
- For non-trivial work, keep `.planning/` artifacts current so the next session does not drift.
- Avoid broad redesign churn unless the issue explicitly asks for it.

## Local setup

```bash
npm install
npm run dev
```

Default Astro dev server:

- `http://localhost:4321`

## Upwork portfolio data caveat

A first local build requires a valid `.upwork-token.json` in the project root.

- `npm run build` runs `prebuild`
- `prebuild` runs `scripts/fetch-portfolio-build.mjs`
- that script refreshes `src/data/upwork-portfolio.json`

If you do not have local Upwork credentials, do not fake or hand-edit the captured data.

## Verification before opening a PR

Run the baseline checks:

```bash
npm run check
npm run build
```

If the change touches browser behavior, navigation, accessibility, or content rendering, also run the browser smoke suite once it exists for the branch.

## Style rules

- Format with Prettier.
- Keep Astro pages/components readable and narrow in responsibility.
- Prefer extracting stable data/config into `src/data/` or other obvious modules when files become too large.
- Avoid client-side runtime theatrics when static/build-time truth is enough.

## Pull request expectations

A good PR should include:

- the user-visible problem
- the repo-backed fix
- the verification you actually ran
- any caveats or deferred follow-up

If a ticket cannot be fully closed without manual/external work, say that explicitly in the PR notes instead of implying completion.

## Security and disclosures

- See `SECURITY.md` for vulnerability reporting.
- Do not commit secrets, tokens, or copied credential material.
- Treat `.upwork-token.json` and related auth material as local-only.

## Documentation hygiene

If you change:

- stack/runtime versions
- project structure
- verification commands
- trust or policy posture

…then update the relevant docs in the same PR (`README.md`, policy docs, and/or `.planning/` artifacts as appropriate).
