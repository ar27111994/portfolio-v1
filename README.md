# ar27111994.dev — Portfolio v1 (Astro)

![CI](https://github.com/ar27111994/portfolio-v1/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-0f172a.svg)

Personal portfolio for Ahmed Rehan — developer tools, agent systems, webhooks, automation, and client-facing engineering proof.

## Stack

- Astro 7 (static-first site)
- `@astrojs/sitemap`
- Vercel (hosting + serverless functions + cron)
- Build-time Upwork portfolio snapshot with lightweight runtime refresh support

## Trust / community files

- License: `LICENSE` (MIT)
- Security policy: `SECURITY.md`
- Contributing guide: `CONTRIBUTING.md`
- Code of conduct: `CODE_OF_CONDUCT.md`
- Live privacy notice: `/privacy` (`src/pages/privacy.astro`)

Some products published from this surface are local-only downloads, while others are cloud-assisted/API-routed tools. The privacy policy explicitly distinguishes between those modes.

## Local dev

```bash
npm install
npm run dev
```

Default Astro dev server:

- `http://localhost:4321`

First local build requires a valid `.upwork-token.json` in the project root. See “Upwork portfolio data” below.

## Verification

Baseline repo checks:

```bash
npm run check
npm run build
```

Current CI runs the same quality baseline on GitHub Actions.

## Build & deploy

```bash
npm run build     # runs prebuild (Upwork fetch) → astro build
npm run preview   # preview dist/ locally
```

Production deploys happen automatically via Vercel on push.

## Project structure

```text
api/
  upwork-portfolio.ts        Vercel Serverless Function for Upwork portfolio refreshes
scripts/
  fetch-portfolio-build.mjs  Build-time fetch; writes src/data/upwork-portfolio.json
src/
  assets/
    brand/                   Brand assets and hero image
  components/
    UpworkPortfolioCard.astro
  data/
    upwork-portfolio.json    Build-time snapshot fallback
  layouts/
    Layout.astro             Shared metadata / SEO shell
  pages/
    index.astro              Homepage
    privacy.astro            Privacy policy page
  styles/
    global.css               Global styling
.github/workflows/
  ci.yml                     Repo quality/build workflow
vercel.json                  Cron: POST /api/upwork-portfolio daily at 05:00 UTC
public/resume/               Downloadable resume PDFs
```

## Upwork portfolio data

Portfolio items are kept fresh via two layers:

| Layer               | How                                                                  | When                               |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| Build-time snapshot | `prebuild` runs `scripts/fetch-portfolio-build.mjs`                  | Every Vercel deploy                |
| Live endpoint       | `/api/upwork-portfolio` can refresh the visible Upwork project count | Lightweight runtime refresh        |
| Daily cron          | Vercel cron POSTs `/api/upwork-portfolio` daily at 05:00 UTC         | Automatic refresh + token rotation |

### Initial local auth (one-time)

The OAuth PKCE initial auth flow is not included in this repo. Use the Upwork Developer Portal to get a token manually and save it as `.upwork-token.json`:

```json
{
  "access_token": "oauth2v2_...",
  "refresh_token": "oauth2v2_...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "obtained_at": "2026-06-09T09:29:07.536Z"
}
```

Token refresh is automatic from that point on.

### Required env vars (Vercel)

| Variable                   | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `UPWORK_API_KEY`           | OAuth2 client ID                                |
| `UPWORK_API_SECRET`        | OAuth2 client secret                            |
| `UPWORK_ACCESS_TOKEN`      | Current access token (auto-rotated)             |
| `UPWORK_REFRESH_TOKEN`     | Long-lived refresh token                        |
| `UPWORK_TOKEN_OBTAINED_AT` | Epoch ms when token was last issued             |
| `UPWORK_TOKEN_EXPIRES_IN`  | Token TTL in seconds (usually 86400)            |
| `VERCEL_API_TOKEN`         | Vercel API token for in-place token persistence |
| `VERCEL_PROJECT_ID`        | `prj_BBdQSGmlMeQXGPyXVqBT1oCYSLHg`              |
| `VERCEL_TEAM_ID`           | `team_APuR5C9ajzlq0OLwjgkjl3hQ`                 |
| `CRON_SECRET`              | Guards the cron POST endpoint                   |

## Deploy (Vercel)

1. Push to GitHub (`portfolio-v1`).
2. Import in Vercel — Astro preset should auto-detect.
3. Ensure the environment variables above are set in Vercel.
4. Build command: `npm run build`
5. Output directory: `dist`

## Important content files

- `src/pages/index.astro` — homepage sections and page composition shell
- `src/pages/privacy.astro` — privacy policy
- `src/styles/global.css` — styling system
- `src/layouts/Layout.astro` — metadata / SEO shell
- `public/resume/*.pdf` — downloadable resumes

## Certifications

Anthropic course track (completed June 2026):

- Building with the Claude API
- Claude Code in Action
- Introduction to Agent Skills
- Introduction to Model Context Protocol

Coursera (2018–2019):

- Machine Learning Strategy
- Deep Learning
- TensorFlow
- Big Data / Hadoop

## Future ideas

- Project case-study pages with screenshots and metrics
- `/now` page and changelog
- Blog via Astro content collections
- Additional browser QA / release-quality gates
