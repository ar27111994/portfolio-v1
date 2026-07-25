# Changelog

All notable changes to `ar27111994.dev` (portfolio-v1) are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
with [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] — 2026-07-22

### Changed

- **prefetchAll** enabled globally for instant navigation across all eligible links; load-time prefetching also applied to privacy links

## [0.1.0] — 2026-07-21

### Added

- **10-section navigation** with TESTIMONIALS, FEED, RESUME added to anchor-rail
- **Hamburger menu** for mobile (≤860px) with animated toggle and close-on-outside-click
- **Image gallery lightbox** — click-to-zoom, pan, prev/next, keyboard nav
- **Rigid paper-cutout shadow system** — 3-layer depth across light/dark themes
- **169-token design system** with zero undefined/dangling tokens
- **DTCG-compliant tokens.json** export for design tool integration
- **NVIDIA, AMD, AWS, Google Cloud developer partner badges**
- **3 new portfolio projects**: OpenCorporates, SupaHooks, AI Dev Suite
- **Playwright test suite**: accessibility (axe-core), SEO, performance
- **CI e2e job** — build + preview + Playwright tests
- **`.pa11yci.json`** for CI accessibility testing
- **MIT License**

### Changed

- **Astro 6.4.8** — upgraded from 6.4.6, XSS advisory fixed
- **CSS minifier** — esbuild for lightningcss compatibility
- **Paper-like theme** — warm background, cardstock dark mode, paper texture
- **Signal bars** — varied fill widths (84%–58%) with dual-background text
- **Snapshot block** — gradient accent left border for visual distinction
- **Anchor IDs** — clean `#proof` instead of `#proof-title` (14 renamed)
- **Heading hierarchy** — case study `h4` → `strong.cs-label` (WCAG)
- **Resume PDFs** regenerated with latest projects and partner badges
- **Vitest config** — coverage targets `src/` with baseline thresholds
- **README** — corrected Astro version to 6

### Fixed

- **Missing CSS brace** in `global-components.css`
- **`:global()` syntax** removed from `privacy.css`
- **Hero-aside artifact** — single-column at 861–950px
- **WCAG contrast** — signal-bar text, signal-note, button-primary, count-badge
- **Dark theme** — feed gradients, signal-board, brand-accent text, icon filters
- **Feed visibility** — `strong` text, `<small>` hover states, feed-source pills
- **Card overflow** — removed restrictive `min-height`s and `height: 100%`
- **Upwork pagination** — duplicate page numbers, all-items arrow disable

### Removed

- **GraphQL prebuild** — `fetch-portfolio-build.mjs`, Vercel cron, `api/upwork-portfolio.ts`
- **Deprecated API test** — referenced deleted upwork-portfolio.ts

## [0.1.0] — Initial Public Launch (prior)

### Added

- **Homepage** — 12-section responsive landing page with hero, featured
  products, live Upwork portfolio grid, certifications, tech stack, contact
  section, and resume downloads
- **Upwork portfolio** — live portfolio data via Vercel serverless function with
  auto-refreshing OAuth2 tokens and daily cron refresh
- **Privacy policy page** — `/privacy` route with data-handling and
  cookie/tracking disclosures
- **Resume downloads** — 3 PDF variants: full, one-page, and client/freelance
- **SEO foundations** — JSON-LD Person schema, Open Graph tags, Twitter Cards,
  sitemap.xml, canonical URLs
- **Performance** — static Astro build (SSG), critical CSS inlined, Inter font
  with `font-display: swap`, preconnect hints
- **Accessibility** — semantic HTML landmarks, skip-to-content link, `aria-live`
  regions for dynamic content, prefers-reduced-motion support
- **CI pipeline** — GitHub Actions with `npm run check` (typecheck + eslint +
  prettier) and full `npm run build`
- **Security** — HTTP security headers (X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy via Vercel), cron endpoint guarded by
  `CRON_SECRET` bearer token
- **Community health** — MIT LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md,
  SECURITY.md
- **Repository badges** — CI status, license, and Astro version shields in
  README

### Fixed

- Prettier formatting across 45+ files (resolved `npm run check` failure)
- Stale `products.astro` reference in README (products now at subdomain)
- `engines.node` aligned with CI Node version (both pinned to 22.12)
- API error responses no longer leak internal `err.message` to clients
- CRON_SECRET comparison upgraded to constant-time (`crypto.timingSafeEqual`)
- Accent contrast: white-on-orange/green CTA buttons now meet WCAG AA
- Dead Discord contact link (`/channels/@me`) replaced with valid invite
- Header and footer `<header>`/`<footer>` landmarks added; skip link
  repositioned past the nav
- Availability dot now has an accessible label

[0.1.0]: https://github.com/ar27111994/portfolio-v1/releases/tag/v0.1.0
[0.1.1]: https://github.com/ar27111994/portfolio-v1/releases/tag/v0.1.1
