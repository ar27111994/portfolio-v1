# Changelog

All notable changes to `ar27111994.dev` (portfolio-v1) are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
with [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Astro 6.4.8** — upgraded from 6.4.6 with XSS advisory fix
- **CSS minifier** — switched to esbuild for lightningcss compatibility

### Fixed
- **Missing CSS brace** in `global-components.css` — unclosed `img[alt*="Gleam"]` block
- **`:global()` syntax** removed from `privacy.css` for Astro 7+ compatibility
- **Case study headings** — `h4` → `strong.cs-label` for proper heading hierarchy (WCAG)
- **Hero-aside artifact** — single-column layout at 861–950px prevents dark circle

## [0.1.0] — Initial Public Launch

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
