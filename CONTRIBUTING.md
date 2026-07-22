# Contributing

Thanks for your interest in contributing to this portfolio site.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:4321
```

> A valid `.upwork-token.json` is required for the portfolio data fetch.
> See the README for setup instructions.

## Development Workflow

1. **Fork** the repo and create a feature branch from `main`.
2. **Keep changes small** — one logical change per PR.
3. **Run checks locally** before pushing:

   ```bash
   npm run check        # typecheck + lint + format
   npm run build        # full production build
   ```

4. **Write clear commit messages** following
   [Conventional Commits](https://www.conventionalcommits.org/).

## Code Style

- **TypeScript** for all logic files
- **Astro** for pages and components
- **CSS** in `src/styles/global-theme.css + global-layout.css` using design tokens from `:root`
- Run `npm run format` before committing (enforced by Husky pre-commit hook)

## Pull Request Checklist

- [ ] `npm run check` passes
- [ ] `npm run build` succeeds
- [ ] No new console errors in dev
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] Lighthouse scores: Performance ≥ 95, Accessibility = 100, SEO = 100
- [ ] Dark mode not broken (if applicable)

## Project Structure

```
src/
  pages/             Astro page components
  layouts/           Layout shell (metadata, SEO, font loading)
  components/        Reusable Astro components
  data/              Build-time data (JSON snapshots)
  styles/            Global CSS

api/                 Vercel serverless functions
scripts/             Build/prebuild scripts
public/              Static assets (resumes, brand assets)
```

## Questions?

Open a discussion or email [admin@ar27111994.dev](mailto:admin@ar27111994.dev).
