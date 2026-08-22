/**
 * Markdown variants of the portfolio's pages, generated at build time from the
 * same data arrays the UI components render (single source of truth).
 *
 * These are served to AI agents that request `Accept: text/markdown` through
 * the edge middleware, and are also published at /md/*.md for direct fetch.
 * Each variant stays well under the ~100K-character agent-context budget.
 */
import {
  contactEmail,
  secondaryEmail,
  whatsappUrl,
  upworkProfileUrl,
  yearsLabel,
  servicesOfferings,
  featuredProjects,
  additionalProjects,
  caseStudies,
  capabilities,
  certificationLinks,
  testimonials,
  upworkPortfolioItems,
  upworkPortfolioCount,
  upworkPortfolioCountLabel,
  upworkProofCards,
  upworkFitTags,
  profileLinks,
  resumeWidgets,
  contactWidgets,
  writingLinks,
  badges,
  proofStackMetrics,
  credibilityFacts,
} from "../../data/site-content";
import { privacyPolicyMarkdown } from "../privacy-policy";

const SITE = "https://www.ar27111994.dev";

/** Map of normalized page path ("" = "/") to its markdown variant filename. */
export const MARKDOWN_VARIANTS: Record<string, string> = {
  "": "home",
  about: "about",
  contact: "contact",
  privacy: "privacy",
  work: "work",
};

export function mdVariantForPath(normalizedPath: string): string | null {
  return MARKDOWN_VARIANTS[normalizedPath] ?? null;
}

function link(text: string, url: string): string {
  return `[${text}](${url})`;
}

function bulletList(items: Array<{ label: string; href?: string }>): string {
  return items
    .map((item) =>
      item.href ? `- ${link(item.label, item.href)}` : `- ${item.label}`,
    )
    .join("\n");
}

/* ── Home ─────────────────────────────────────────────────────────── */

export function homeMarkdown(): string {
  const services = servicesOfferings
    .map((s) => `- **${s.title}** — ${s.summary}`)
    .join("\n");
  const featured = featuredProjects
    .map(
      (p) =>
        `- **${p.name}** (${p.status}) — ${p.summary} — ${link("Repository", p.href)}` +
        (p.highlights.length ? ` Highlights: ${p.highlights.join("; ")}` : ""),
    )
    .join("\n");
  const more = additionalProjects
    .map((p) => `- **${p.name}** — ${p.description} — ${link("Link", p.href)}`)
    .join("\n");
  const cases = caseStudies
    .map(
      (c) =>
        `### ${c.title}\n\n- **Context:** ${c.context}\n- **Problem:** ${c.problem}\n- **Approach:** ${c.approach}\n- **Outcome:** ${c.outcome}\n- **Tech:** ${c.tech.join(", ")}\n- **Metrics:** ${c.metrics.join("; ")}`,
    )
    .join("\n\n");
  const caps = capabilities.map((c) => `- ${c.title}`).join("\n");
  const certs = certificationLinks
    .map((c) => `- ${c.label} — ${link("Verify", c.href)}`)
    .join("\n");
  const resumes = resumeWidgets
    .map(
      (r) =>
        `- **${r.label}** (${r.badge}) — ${r.detail} — ${link("PDF", r.href)}`,
    )
    .join("\n");
  const contacts = contactWidgets
    .map(
      (c) =>
        `- **${c.label}:** ${c.value} — ${c.detail} — ${link("Open", c.href)}`,
    )
    .join("\n");
  const links = bulletList(profileLinks);

  return [
    `# Ahmed Rehan — ARLabs (ar27111994.dev)`,
    ``,
    `Ahmed Rehan is a full-stack engineer and solo builder based in Rawalpindi, Pakistan (UTC+5). ${yearsLabel} years across enterprise, freelance, founder, and solo-builder execution. Focus areas: developer tools, webhook/API integrations and debugging, workflow automation, AI-agent tooling (MCP, skills), and performance-conscious full-stack software.`,
    ``,
    `Credentials: ${badges.map((b) => b.label).join(", ")}. GitHub stats: ${proofStackMetrics.map((m) => `${m.label}: ${m.value}`).join(", ")}.`,
    ``,
    `## When to use this site`,
    ``,
    `- **Verify a contractor** — use this site to check Ahmed Rehan's experience, certifications, client history, case studies, and proof-of-work before hiring or recommending him.`,
    `- **Start an engagement** — use /contact to reach him for freelance/contract work in developer tools, webhooks, automation, and AI-agent tooling.`,
    `- **Download a resume** — resume PDFs are listed below and at /resume/.`,
    `- **Query portfolio data programmatically** — call the MCP endpoint at ${link("/mcp", `${SITE}/mcp`)} (Streamable HTTP, read-only).`,
    `- **What this site is not for** — it is not product documentation. Ahmed's product surface lives at ${link("products.ar27111994.dev", "https://products.ar27111994.dev/")}; the penpot-mcp skill lives in its ${link("GitHub repository", "https://github.com/ar27111994/penpot-mcp")}.`,
    ``,
    `## Services`,
    ``,
    services,
    ``,
    `## Featured projects`,
    ``,
    featured,
    ``,
    `## Additional projects`,
    ``,
    more,
    ``,
    `## Case studies`,
    ``,
    cases,
    ``,
    `## Capabilities`,
    ``,
    caps,
    ``,
    `## Certifications`,
    ``,
    certs,
    ``,
    `## Resumes`,
    ``,
    resumes,
    ``,
    `## Upwork freelance proof`,
    ``,
    `- Portfolio size: ${upworkPortfolioCountLabel} items (${upworkPortfolioCount} recorded) — full list at ${link("/work", `${SITE}/work`)}`,
    `- Fit: ${upworkFitTags.join(", ")}`,
    `- Proof cards: ${upworkProofCards.map((c) => `${c.label}: ${c.value}`).join("; ")}`,
    `- ${link("Upwork profile", upworkProfileUrl)}`,
    ``,
    `## Testimonials`,
    ``,
    testimonials
      .map((t) => `- "${t.quote}" — ${t.author}, ${t.role} (${t.relation})`)
      .join("\n"),
    ``,
    `## Contact`,
    ``,
    contacts,
    ``,
    `## Profile links`,
    ``,
    links,
    ``,
    `## Machine-readable entry points`,
    ``,
    `- ${link("llms.txt", `${SITE}/llms.txt`)} — agent index for this site`,
    `- ${link("llms-full.txt", `${SITE}/llms-full.txt`)} — concatenated page text`,
    `- ${link("Sitemap", `${SITE}/sitemap-index.xml`)}`,
    `- ${link("MCP endpoint", `${SITE}/mcp`)} — Streamable HTTP, tools/list for available queries`,
    `- ${link("Markdown variants", `${SITE}/md/home.md`)} — e.g. /md/about.md, /md/work.md, /md/contact.md, /md/privacy.md`,
    ``,
  ].join("\n");
}

/* ── About ────────────────────────────────────────────────────────── */

export function aboutMarkdown(): string {
  const facts = credibilityFacts.map((f) => `- ${f.text}`).join("\n");
  const cases = caseStudies
    .map(
      (c) =>
        `- **${c.title}** (${c.context}) — ${link("Case study", `${SITE}/work`)}`,
    )
    .join("\n");
  const certs = certificationLinks
    .map(
      (c) =>
        `- ${c.label} — ${link("Verify", c.href)}` +
        (c.pdf ? ` — ${link("PDF certificate", c.pdf)}` : ""),
    )
    .join("\n");
  const other = bulletList(profileLinks);

  return [
    `# About — Ahmed Rehan`,
    ``,
    `Ahmed Rehan is a full-stack engineer and solo builder with ${yearsLabel} years of experience across enterprise teams, freelance engagements, founder work, and solo open-source projects. He is based in Rawalpindi, Pakistan (UTC+5) and works async-first with clients worldwide.`,
    ``,
    `Career path: started in web development in 2014, moved into enterprise frontend engineering (most recently four years as Senior Frontend Engineer at Eagle 6, a US cybersecurity firm), then built a freelance delivery practice, shipped products, and is now focused on developer tools, webhook reliability, automation systems, and AI-agent tooling.`,
    ``,
    `## Credibility facts`,
    ``,
    facts,
    ``,
    `## Selected roles and engagements`,
    ``,
    cases,
    ``,
    `## Certifications`,
    ``,
    certs,
    ``,
    `## Working style`,
    ``,
    `- Async-friendly with clear written updates, artifacts, and demos.`,
    `- Reliability-first: documented, tested, and boring where it matters.`,
    `- Solo-founder discipline: ships complete work, not partial promises.`,
    `- Security-sensitive defaults for anything touching user traffic.`,
    ``,
    `## Open source and community`,
    ``,
    `Maintains agent-harness, Webhook Debugger and Logger, penpot-mcp, and curated agent-skill collections on ${link("GitHub", "https://github.com/ar27111994")}. Writes on Dev.to and launches on Hacker News; published articles:`,
    ``,
    writingLinks
      .map((w) => `- ${w.label} — ${link(w.source, w.href)} (${w.date})`)
      .join("\n"),
    ``,
    `## Links`,
    ``,
    other,
    ``,
  ].join("\n");
}

/* ── Contact ──────────────────────────────────────────────────────── */

export function contactMarkdown(): string {
  const channels = contactWidgets
    .map(
      (c) =>
        `- **${c.label}:** ${c.value} — ${c.detail} — ${link("Contact via " + c.label, c.href)}`,
    )
    .join("\n");
  const socials = bulletList(profileLinks);

  return [
    `# Contact — Ahmed Rehan`,
    ``,
    `Ahmed Rehan, ARLabs — ${link("ar27111994.dev", SITE)}.`,
    ``,
    `## Contact channels`,
    ``,
    channels,
    ``,
    `## Which channel to use`,
    ``,
    `- **Email (${contactEmail})** — best for project briefs, partnerships, and longer context. Response within 1–2 business days (Asia/Karachi, UTC+5). Direct secondary inbox: ${secondaryEmail}.`,
    `- **WhatsApp (+92 331 588 7235 — ${whatsappUrl})** — fast async contact for focused devtools/automation work.`,
    `- **Upwork (${link("profile", upworkProfileUrl)})** — for contract engagements through Upwork's platform.`,
    `- **Social profiles** — GitHub, LinkedIn, X, and others below for public or professional context.`,
    ``,
    `## What to include in a project brief`,
    ``,
    `1. What you are building and the problem it solves.`,
    `2. The stack or platform constraints (if any).`,
    `3. Timeline and budget expectations.`,
    `4. How we will verify success.`,
    ``,
    `## Profiles`,
    ``,
    socials,
    ``,
    `## Also available`,
    ``,
    `- ${link("About", `${SITE}/about`)} · ${link("Work", `${SITE}/work`)} · ${link("Privacy", `${SITE}/privacy`)}`,
    `- ${link("llms.txt", `${SITE}/llms.txt`)} for agent-facing guidance`,
    ``,
  ].join("\n");
}

/* ── Privacy ──────────────────────────────────────────────────────── */

export function privacyMarkdown(): string {
  // The policy text lives in src/lib/privacy-policy.ts — one source shared
  // with the /privacy HTML page (privacy.astro); this is its Markdown
  // rendering for agents.
  return privacyPolicyMarkdown();
}

/* ── Work ─────────────────────────────────────────────────────────── */

export function workMarkdown(): string {
  const items = upworkPortfolioItems
    .map((item) => {
      const when = item.completionDate
        ? ` (completed ${item.completionDate})`
        : "";
      const url = item.url ? ` — ${link("Project link", item.url)}` : "";
      const skills = item.skills?.length
        ? ` Skills: ${item.skills.slice(0, 8).join(", ")}.`
        : "";
      const desc = item.displayDescription ?? item.description;
      return `### ${item.title}${when}${url}\n\n${desc}${skills}`;
    })
    .join("\n\n");

  return [
    `# Work — Upwork project trail (Ahmed Rehan)`,
    ``,
    `Recorded public work history: ${upworkPortfolioCountLabel} items (${upworkPortfolioCount} recorded), 40+ jobs completed, 5★ rating. Full profile: ${link("Upwork", upworkProfileUrl)}.`,
    ``,
    `Fit signals: ${upworkFitTags.join(", ")}.`,
    ``,
    `Proof cards: ${upworkProofCards.map((c) => `${c.label} — ${c.value}`).join("; ")}.`,
    ``,
    `## Featured portfolio records`,
    ``,
    items,
    ``,
  ].join("\n");
}

/* ── Full-text aggregate ──────────────────────────────────────────── */

export function llmsFullText(): string {
  return [
    homeMarkdown(),
    "\n\n---\n\n",
    aboutMarkdown(),
    "\n\n---\n\n",
    workMarkdown(),
    "\n\n---\n\n",
    contactMarkdown(),
    "\n\n---\n\n",
    privacyMarkdown(),
  ].join("");
}
