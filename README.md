# ar27111994.dev — Portfolio v1 (Astro)

Personal portfolio for **Ahmed Rehan** — devtools, agent systems, webhooks & automation.

## Stack

- Astro 6 (static output)
- `@astrojs/sitemap`
- Vercel (hosting + serverless functions + cron)

## Trust / policy files

- License: `LICENSE` (MIT)
- Security disclosures: `SECURITY.md`
- Live privacy notice: `/privacy` (`src/pages/privacy.astro`)

Some products published from this surface are local-only downloads, while others
are cloud-assisted/API-routed tools. The privacy policy now distinguishes between
those modes explicitly.

## Local dev

```bash
npm install
npm run dev       # http://localhost:4321
```

> First-time local build requires a valid `.upwork-token.json` in the project root.
> See **Upwork portfolio data** below.

## Build & deploy

```bash
npm run build     # runs prebuild (Upwork fetch) → astro build
npm run preview   # preview dist/ locally
```

Production deploys happen automatically via Vercel on push.

## Project structure

```
api/
  upwork-portfolio.ts   — Vercel Serverless Function: live portfolio endpoint
                          (GET /api/upwork-portfolio) + token auto-refresh
scripts/
  fetch-portfolio-build.mjs — Build-time fetch; writes src/data/upwork-portfolio.json
src/
  pages/index.astro     — Homepage; fetches /api/upwork-portfolio client-side
  components/
    UpworkPortfolioCard.astro
  data/
    upwork-portfolio.json  — Build-time snapshot (fallback / SSG)
vercel.json             — Cron: POST /api/upwork-portfolio daily at 05:00 UTC
```

## Upwork portfolio data

Portfolio items are kept fresh via two layers:

| Layer               | How                                                          | When                               |
| ------------------- | ------------------------------------------------------------ | ---------------------------------- |
| Build-time snapshot | `prebuild` runs `scripts/fetch-portfolio-build.mjs`          | Every Vercel deploy                |
| Live endpoint       | `GET /api/upwork-portfolio` fetches real-time data           | Every page load                    |
| Daily cron          | Vercel cron POSTs `/api/upwork-portfolio` daily at 05:00 UTC | Automatic refresh + token rotation |

### Initial local auth (one-time)

The OAuth PKCE initial auth flow is not included in this repo (use the Upwork Developer Portal to
get a token manually and save it as `.upwork-token.json`):

```json
{
  "access_token": "oauth2v2_...",
  "refresh_token": "oauth2v2_...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "obtained_at": "2026-06-09T09:29:07.536Z"
}
```

Token refresh is fully automatic from that point on.

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

1. Push to GitHub (repo: `portfolio-v1`).
2. Import in Vercel — Astro preset auto-detected.
3. Ensure all env vars above are set in Vercel → Settings → Environment Variables.
4. Build command: `npm run build` / Output: `dist`.

## DNS (Dynadot → Vercel)

- **A record**: `@` → `76.76.21.21`
- **CNAME**: `www` → `cname.vercel-dns.com`

## Important content files

- `src/pages/index.astro` — homepage sections
- `src/pages/products.astro` — products page
- `src/pages/privacy.astro` — privacy policy
- `src/styles/global.css` — styling
- `src/layouts/Layout.astro` — metadata / SEO shell
- `public/resume/*.pdf` — downloadable resumes

## Certifications

Claude Partner Network — Anthropic (all completed June 2026):

- Building with the Claude API
- Claude Code in Action
- Introduction to Agent Skills
- Introduction to Model Context Protocol

Coursera (2018–2019): ML Strategy, Deep Learning, TensorFlow, Big Data/Hadoop.

## Future ideas

- Project case-study pages with screenshots/metrics
- `/now` page and changelog
- Blog via Astro content collections
- Analytics (Plausible or Umami)
