# Phase 02 Research — homepage conversion + runtime/perf cleanup

## Tickets mapped into this phase

- #9 — consolidate to one primary CTA; move sponsor/funding off the hire path
- #10 — add a clear "what I build / how we start" services block
- #11 — de-jargon client-facing copy; remove/relabel arbitrary % bars
- #12 — mobile nav scroll affordance
- #13 — self-host/subset Inter
- #20 — reduce DOM cost / snap font-weights / drop `background-attachment: fixed`
- #22 — deduplicate aria-live proof-stack markup
- #24 — guard/cache/remove unauthenticated GitHub browser API calls
- #26 — SEO nits: drop meta keywords, revisit locale
- #27 — align CI Node version with engines floor
- #18 (partial) — README cleanup where it is obviously stale

## Key repo evidence

- Hero currently exposes three equal-weight contact CTAs plus a secondary proof strip and additional contact surface (`src/pages/index.astro`).
- The page still uses dashboard/jargon phrases such as "proof surface", "proof stack", "Captured Upwork record", and "Funding / sponsor links".
- The hero renders proof metrics twice (desktop + mobile) with duplicated `aria-live` nodes.
- The hero also renders arbitrary percentage bars (`proofCategories`) with no public source.
- Client-side code calls unauthenticated GitHub APIs on every visit for stats and feed data.
- Layout still loads Inter from Google Fonts instead of self-hosting.
- CSS still uses non-standard heavy font weights, `background-attachment: fixed`, and a hidden mobile section-nav scrollbar.
- README still references `src/pages/products.astro`, which no longer exists in the repo.

## Technical decisions

- Replace the "developer lab" framing with a more buyer-friendly services framing.
- Keep the current public work / profile / Upwork evidence, but make it read like support material rather than the main message.
- Remove the duplicated mobile proof stack instead of trying to keep two synchronized live-metric regions.
- Keep GitHub metrics static/build-time on the page; do not fetch them in the browser.
- Keep the curated fallback feed and optionally public writing fetches that do not create the same rate-limit fragility.
- Use a self-hosted Inter package instead of the Google-hosted stylesheet.

## Known limits

- Testimonial and case-study tickets remain separate because they require tighter source curation; if direct scraping stays unreliable, user-supplied quote text plus source URLs from Upwork/LinkedIn is an acceptable evidence path.
- Source evidence for testimonials is now available from user-provided LinkedIn recommendations and Upwork review text/URLs, so the testimonial blocker is reduced to packaging and selection rather than source discovery.
- Lighthouse/axe CLI execution may still be environment-sensitive on this machine; if blocked, preserve manual/DOM-level evidence and note the blocker explicitly.
