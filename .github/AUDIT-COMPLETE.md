# PR #70 — Complete Comment Audit

**102 comments manually verified against current code at commit d8375f0.**

---

## Genuinely Remaining Issues (10)

| #   | Comment              | File                            | Issue                                                                      | Severity |
| --- | -------------------- | ------------------------------- | -------------------------------------------------------------------------- | -------- |
| 26  | Layout inline theme  | `src/layouts/Layout.astro:126`  | No `try/catch` around `localStorage.getItem()` — throws if storage blocked | Medium   |
| 29  | OG URL test          | `tests/seo.spec.ts:26`          | Hardcoded `ar27111994.dev` — fails in CI at localhost                      | High     |
| 30  | Canonical test       | `tests/seo.spec.ts:71`          | Hardcoded `ar27111994.dev` — fails in CI at localhost                      | High     |
| 31  | YouTube iframe       | `UpworkPortfolioCard.astro:667` | Missing `referrerpolicy` on iframe                                         | Low      |
| 32  | Vimeo iframe         | `UpworkPortfolioCard.astro:678` | Missing `referrerpolicy` on iframe                                         | Low      |
| 47  | Domain inconsistency | `privacy.astro:6`               | `siteUrl` uses apex; `astro.config.mjs` uses www                           | Medium   |
| 78  | CORS value invalid   | `vercel.json:31`                | Comma-separated origins not valid in CORS header                           | High     |
| 93  | Regex false positive | `site-content.test.ts:46`       | `export const contactEmail` regex matches `contactEmailOld`                | Low      |
| 94  | Regex false positive | `site-content.test.ts:76`       | `export interface Badge` regex matches `BadgeX`                            | Low      |
| 95  | YouTube sandbox      | `UpworkPortfolioCard.astro:667` | Missing `sandbox` attribute on iframe                                      | Low      |

---

## Non-Genuine / Pre-Existing / Enhancement (13)

| #   | Comment              | Issue                                     | Reason Skipped                      |
| --- | -------------------- | ----------------------------------------- | ----------------------------------- |
| 19  | Feed items skipped   | `FEED_BATCH=6` renders fewer than fetched | Design choice — progressive loading |
| 28  | "Goggle Hunt" typo   | Heading near line 206                     | Confirmed correct branding by user  |
| 33  | Feed caching         | No `Cache-Control` headers                | Enhancement, not regression         |
| 44  | Vitest 0% thresholds | Coverage thresholds at 0                  | By design for static site           |
| 52  | LinkedIn fail-fast   | No check when PERSON_URN empty            | Has valid fallback (sN2bD0M7oN)     |
| 69  | Feed sentinel        | IdleCallback/setTimeout pattern           | Already handled with fallback       |
| 76  | `any[]` type         | `upworkPortfolioItems` typed as any       | Pre-existing before PR              |
| 77  | `any[]` type         | `upworkProofCards` typed as any           | Pre-existing before PR              |
| 79  | Swiper CSS SRI       | Missing integrity on CDN CSS              | Pre-existing, not regression        |
| 80  | Swiper JS SRI        | Missing integrity on CDN JS               | Pre-existing, not regression        |
| 81  | Attachment merge     | Index-based merge in transform            | Pre-existing data pipeline          |
| 97  | LinkedIn 500 → 200   | Throws on missing config                  | Enhancement, not regression         |
| 98  | LinkedIn guard       | Empty token before API call               | Enhancement, not regression         |

---

## Already Fixed (79)

All remaining 79 comments verified fixed in current code.

| Category     | Count | Examples                                                                                    |
| ------------ | ----- | ------------------------------------------------------------------------------------------- |
| CI/CD        | 9     | Permissions, browsers, port, baseURL, coverage reporter, build step, test name              |
| CSS/Tokens   | 10    | Broken min-, text-dim duplicates, --w unused, word-break, clip, duplicate filters, --tag-\* |
| LinkedIn/API | 16    | PERSON_URN, ACCESS_TOKEN, OPTIONS handlers, date sort, empty date, token scoping            |
| Tests        | 12    | CLS syntax, LCP/FCP robustness, MAX_TTI_MS, LIVE, robots.txt regex, pa11y port              |
| JS           | 7     | \_feedLoading, scroll guard, fallbackItems, theme consolidation, touch events               |
| Components   | 6     | Provider field, duplicate IDs, lightbox HTML, accentColors.length, totalPages               |
| Docs         | 7     | README global.css, CONTRIBUTING, CHANGELOG duplicates, SECURITY.md, .upwork-token           |
| Meta         | 12    | CodeQL, coverage artifacts, Swiper dep, playwright version, npm test script                 |

---

## Summary

| Status                     | Count   |
| -------------------------- | ------- |
| Fixed                      | 79      |
| Genuinely remaining        | 10      |
| Non-genuine / Pre-existing | 13      |
| **Total**                  | **102** |
