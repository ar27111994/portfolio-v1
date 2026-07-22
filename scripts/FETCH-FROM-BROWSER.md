# Fetch Upwork Portfolio Data

Cloudflare + OAuth scope limitations prevent automated fetching via CI.
This manual process uses `curl` with browser cookies to get ALL attachments
(including embedded links like Loom, GitHub, X/Twitter).

## Prerequisites

1. Log into **<https://www.upwork.com>** in Chrome
2. Open DevTools (`F12`) → **Network** tab
3. Go to your freelancer profile: `/freelancers/~0188baee67e8f543e7`
4. Find the `getPortfolioProjects` GraphQL request in Network
5. Right-click → **Copy** → **Copy as cURL**

This gives you a curl command with all the auth cookies needed.

## Step 1 — Fetch from browser GraphQL API

```bash
# The browser-internal GraphQL (getPortfolioProjects) returns ALL attachments.
# Use pageSize=50 (or higher) to get all projects in one request.
# Replace the cookies below with fresh ones from DevTools.

curl 'https://www.upwork.com/api/graphql/v1?alias=getPortfolioProjects' \
  -H 'content-type: application/json' \
  -b '<paste-your-cookies-here>' \
  --data-raw '{
    "query": "... (see full query below)",
    "variables": {
      "personId": "424245383220543488",
      "published": true,
      "page": 0,
      "pageSize": 50,
      "sortDirection": "DESC",
      "sortFields": ["rank"]
    }
  }' \
  -o src/data/upwork-raw.json
```

> **Important**: The cookies expire. Re-copy the curl command from DevTools each time.
> The full GraphQL query includes ALL attachment fields (`originalAttachment`, `creationTs`,
> `imageLarge`, `videoUrl`, `embeddedLinkUrl`, etc.) — see the transform script for the exact
> fields expected.

## Step 2 — Transform the raw data

```bash
# Convert the raw GraphQL response to the portfolio format
node scripts/transform-portfolio.mjs src/data/upwork-raw.json

# Clean up
rm src/data/upwork-raw.json
```

The result is an updated `src/data/upwork-portfolio.json` with ALL attachments for every project.

## Step 3 — Download thumbnail images

```bash
npm run download-thumbnails
```

This downloads screenshots and thumbnails to `public/upwork-covers/`.

## Step 4 — Build

```bash
npm run build
```

## Notes

- The `getPortfolioProjects` browser GraphQL returns **all** attachment types including
  `embeddedLink` (Loom, GitHub, X/Twitter links) — unlike the developer GraphQL
  (`talentProfile`) which caps at 3 attachments
- Cookies last ~24 hours — re-copy from DevTools for each fetch
- The `pageSize` field determines how many projects are returned per page.
  Set it high enough to get all projects in one request
- Always run `download-thumbnails` after fetching to ensure local screenshot files
  are up to date
