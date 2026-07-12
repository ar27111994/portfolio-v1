// Site content data extracted from index.astro (#15)
import upworkPortfolio from "./upwork-portfolio.json";

// ── Shared type definitions ─────────────────────────────────────────────

export interface Badge {
  label: string;
  icon?: string;
  mark?: string;
}
export interface ProofMetric {
  value: string;
  label: string;
  detail: string;
  stat?: string;
}
export interface ProofCategory {
  label: string;
}
export interface ServiceOffering {
  title: string;
  summary: string;
  icon: string;
}
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  relation: string;
  href: string;
  platform: string;
}
export interface CaseStudy {
  title: string;
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  tech: string[];
  metrics: string[];
}
export interface FeaturedProject {
  name: string;
  status: string;
  visual: string;
  accent: string;
  href: string;
  summary: string;
  highlights: string[];
}
export interface AdditionalProject {
  name: string;
  href: string;
  description: string;
}
export interface WritingLink {
  label: string;
  href: string;
  date?: string;
  source?: string;
  tag?: string;
  icon?: string;
}
export interface FeedSource {
  label: string;
  href: string;
  type: string;
  icon: string;
}
export interface LabNote {
  title: string;
  body: string;
}
export interface ContactWidget {
  kind: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  icon: string;
}
export interface ResumeWidget {
  label: string;
  badge: string;
  detail: string;
  href: string;
  icon: string;
}
export interface ProfileWidget {
  label: string;
  detail: string;
  href: string;
  icon: string;
}
export interface SponsorLink {
  label: string;
  href: string;
  note: string;
  icon: string;
}
export interface CredibilityFact {
  icon: string;
  text: string;
}
export interface VentureProof {
  label: string;
  href: string;
  icon: string;
}
export interface CertificationLink {
  label: string;
  href: string;
  issuer: string;
  icon: string;
  pdf?: string;
}
export interface OpenSourceItem {
  label: string;
  href: string;
  detail?: string;
}
export interface Capability {
  title: string;
  icon?: string;
  cue?: string;
  mark?: string;
  body?: string;
}
export interface ProfileLink {
  label: string;
  href: string;
  icon: string;
  note?: string;
}
export interface UpworkFitTag {
  tag: string;
}

// ── Data arrays ───────────────────────────────────────────────────
export const contactEmail = "admin@ar27111994.dev";
export const secondaryEmail = "ahmed.rehan@ar27111994.dev";
export const whatsappUrl = "https://wa.me/923315887235";
export const upworkProfileUrl = upworkPortfolio.profileUrl;

// ── Dynamic experience years ──────────────────────────────────────────────────
// First professional role: Web Developer — COMITS, Jul 2014
export const CAREER_START_YEAR = 2014;
export const CAREER_START_MONTH = 7; // July (1-indexed)
export const now = new Date();
export const yearsOfExperience =
  now.getFullYear() -
  CAREER_START_YEAR -
  (now.getMonth() + 1 < CAREER_START_MONTH ? 1 : 0);
export const yearsLabel = `${yearsOfExperience}+`;

// ── GitHub stats — written to .env.local by prebuild, read at build time ──────
// Falls back to last-known values if prebuild GitHub fetch was unavailable.
export const ghPublicRepos = import.meta.env.GITHUB_PUBLIC_REPOS ?? "53";
export const ghTotalStars = import.meta.env.GITHUB_TOTAL_STARS ?? "36";
interface UpworkPortfolioAttachment {
  uid?: string;
  type?: string;
  title?: string;
  description?: string;
  rank?: number | null;
  url?: string;
  embeddedUrl?: string;
  originalUrl?: string;
  image?: {
    large?: string;
    medium?: string;
    small?: string;
  };
}

interface UpworkPortfolioItem {
  id: string;
  title: string;
  role?: string;
  description: string;
  displayDescription?: string;
  projectGoal?: string;
  solution?: string;
  skills?: string[];
  url?: string;
  thumbnail?: string;
  thumbnailOriginal?: string;
  completionDate?: string;
  featured?: boolean;
  sourcePage?: number | null;
  attachments?: UpworkPortfolioAttachment[];
}

interface PortfolioDisplayMeta {
  description: string;
  skills: string[];
}

const portfolioDisplayMeta: Record<string, PortfolioDisplayMeta> = {
  "ar27111994.dev": {
    description:
      "Fast Astro portfolio/resume site that turns scattered proof, links, case studies, and contact paths into one client-ready surface.",
    skills: ["Astro", "Portfolio UX", "SEO", "Responsive UI"],
  },
  "penpot-mcp": {
    description:
      "Agent workflow kit for creating, auditing, and maintaining Penpot design systems, prototypes, tokens, and design-to-code handoff.",
    skills: ["AI workflows", "Design systems", "MCP", "Frontend"],
  },
  "agent-harness": {
    description:
      "TypeScript CLI for discovering, staging, activating, and wiring reusable AI-agent assets across modern coding hosts.",
    skills: ["TypeScript", "CLI", "AI agents", "Developer tooling"],
  },
  "Webhook Debugger and Logger": {
    description:
      "Open-source webhook debugging suite for capturing, inspecting, replaying, forwarding, validating, and mocking webhook traffic.",
    skills: ["Webhooks", "API tooling", "Replay", "Debugging"],
  },
};
const inferPortfolioTags = (item: UpworkPortfolioItem) => {
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (text.includes("webhook")) return ["Webhooks", "APIs", "Debugging"];
  if (text.includes("angular") || text.includes("ionic"))
    return ["Frontend", "Angular", "App UI"];
  if (text.includes("opencart") || text.includes("woocommerce"))
    return ["E-commerce", "PHP", "CMS"];
  if (text.includes("wordpress")) return ["WordPress", "CMS", "Responsive UI"];
  if (text.includes("azure") || text.includes("citrix"))
    return ["Azure", "Infrastructure", "POC"];
  if (
    text.includes("crm") ||
    text.includes("erp") ||
    text.includes("management")
  ) {
    return ["Admin systems", "Dashboards", "Backend"];
  }
  return ["Client project", "Web development"];
};
export const upworkPortfolioItems = (
  upworkPortfolio.items as unknown as UpworkPortfolioItem[]
)
  .map((item) => ({
    ...item,
    displayDescription:
      portfolioDisplayMeta[item.title]?.description ?? item.description,
    skills: item.skills?.length
      ? item.skills
      : (portfolioDisplayMeta[item.title]?.skills ?? inferPortfolioTags(item)),
  }))
  // Sort latest completionDate first; items with no date go to the end
  .sort((a, b) => {
    const da = a.completionDate ? new Date(a.completionDate).getTime() : 0;
    const db = b.completionDate ? new Date(b.completionDate).getTime() : 0;
    return db - da;
  });
export const upworkPortfolioCount = upworkPortfolioItems.length;
// If the JSON has exactly 20 items it was written by the official API (capped
// at 20 by Upwork API-598). Show "20+" to signal more exist on the live profile.
// If a browser-session fetch has populated more items, use the real count.
export const UPWORK_API_CAP = 20;
export const upworkPortfolioCountLabel =
  upworkPortfolioCount === UPWORK_API_CAP
    ? `${upworkPortfolioCount}+`
    : String(upworkPortfolioCount);
export const recentUpworkProofItems = upworkPortfolioItems
  .filter((item) => item.featured)
  .slice(0, 4);
export const recentUpworkProofTitles = (
  recentUpworkProofItems.length
    ? recentUpworkProofItems
    : upworkPortfolioItems.slice(0, 4)
)
  .map((item) => item.title)
  .join(" · ");

export const profileLinks = [
  {
    label: "GitHub",
    href: "https://github.com/ar27111994",
    icon: "/brand-icons/github.svg",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/ar27111994",
    icon: "/brand-icons/linkedin.svg",
  },
  {
    label: "Upwork",
    href: upworkProfileUrl,
    icon: "/brand-icons/upwork.svg",
  },
  {
    label: "X/Twitter",
    href: "https://x.com/ar27111994",
    icon: "/brand-icons/x.svg",
  },
  {
    label: "Product Hunt",
    href: "https://www.producthunt.com/@ar27111994",
    icon: "/brand-icons/producthunt.svg",
  },
  {
    label: "Stack Overflow",
    href: "https://stackoverflow.com/users/3841610/ar27111994",
    icon: "/brand-icons/stackoverflow.svg",
  },
  {
    label: "Hacker News",
    href: "https://news.ycombinator.com/user?id=ar27111994",
    icon: "/brand-icons/ycombinator.svg",
  },
  {
    label: "Dev.to",
    href: "https://dev.to/ar27111994",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label: "Hashnode",
    href: "https://hashnode.com/@ar27111994",
    icon: "/brand-icons/hashnode.svg",
  },
  {
    label: "Medium",
    href: "https://medium.com/@arlabs",
    icon: "/brand-icons/medium.svg",
  },
  {
    label: "CoderLegion",
    href: "https://coderlegion.com/user/ar27111994",
    icon: "/brand-icons/coderlegion.svg",
  },
  {
    label: "Discord",
    href: "#contact-title",
    note: "ar27111994 — DM for server invite",
    icon: "/brand-icons/discord.svg",
  },
];

export const badges = [
  { label: "Anthropic Certified", icon: "/brand-icons/anthropic.svg" },
  { label: "Microsoft Certified", icon: "/brand-icons/microsoft.svg" },
  {
    label: "Open-source maintainer",
    icon: "/brand-icons/opensourceinitiative.svg",
  },
  { label: "Devtools builder", icon: "/brand-icons/github.svg" },
  { label: "Webhook/API tooling", mark: "API" },
  { label: "Productivity systems", mark: "FLOW" },
  { label: "Enterprise-aware delivery", mark: "B2B" },
  { label: "Remote / async ready", mark: "↗" },
  { label: "Reliability-first shipping", mark: "✓" },
];

export const proofStackMetrics = [
  {
    value: yearsLabel,
    label: "years",
    detail: "enterprise, freelance, founder, solo builds",
  },
  {
    value: ghPublicRepos,
    label: "public repos",
    detail: "fetched from GitHub at build time; syncs live in-browser",
    stat: "githubRepos",
  },
  {
    value: ghTotalStars,
    label: "GH stars",
    detail: "fetched from GitHub at build time; syncs live in-browser",
    stat: "githubStars",
  },
];

export const proofCategories = [
  { label: "Devtools" },
  { label: "Integrations" },
  { label: "Automation" },
  { label: "Agents" },
  { label: "Enterprise" },
];

export const servicesOfferings = [
  {
    title: "Developer Tools",
    summary:
      "CLI tooling, VS Code extensions, build pipelines, CI/CD automation, and open-source libraries that stay useful after the first launch.",
    icon: "🛠",
  },
  {
    title: "Webhook Debugging & Automation",
    summary:
      "Real-time webhook capture, inspection, replay, validation, and forwarding — from prototype to production-grade reliability tooling.",
    icon: "⚡",
  },
  {
    title: "Agentic Systems & Tooling",
    summary:
      "AI-agent workflows, MCP server design, skill/asset lifecycle management, and agent-harness infrastructure for modern coding hosts.",
    icon: "🤖",
  },
];

export const testimonials = [
  {
    quote:
      "Ahmed exemplifies everything a company would need in a Frontend Developer: Collaborative, Critical Thinker, Open to Suggestions, Hard Worker, and Extremely Knowledgeable. I never had a time where I asked him to work on a story or project that he wasn't confident in accomplishing. Other developers sing his praises the same.",
    author: "Reilly Gray, CLTL",
    role: "Scrum Master II · CSM · A-CSM",
    relation: "Managed Ahmed directly at Eagle 6",
    href: "https://www.linkedin.com/in/reilly-gray-cltl-930097136/",
    platform: "LinkedIn",
  },
  {
    quote:
      "I have had the pleasure of working as Ahmed's business analyst and product manager for 2 years at EAGLE6 and witnessed Ahmed create desirable and innovative UI solutions to complex cyber security problems, on schedule without fail. Not only is Ahmed ridiculously talented as a front end developer but his work ethic, character, and commitment are above reproach. As a senior developer Ahmed's experience and dedication are wise investments for any Scrum developer team.",
    author: "Donovan Mosley",
    role: "Product Manager · CSPO, CSM",
    relation: "Worked with Ahmed on the same team at Eagle 6",
    href: "https://www.linkedin.com/in/donovanmosley/",
    platform: "LinkedIn",
  },
  {
    quote:
      "Ahmed's work on our project was outstanding. His communication was top-notch, he met all deadlines, and his skills were exceptionally strong. Our project was successful because of Ahmed's tireless work. I look forward to continuing to work with Ahmed on this and future projects. I give him my highest recommendation.",
    author: "Upwork Client",
    role: "Grocery CRUD / CodeIgniter project",
    relation: "61-hour engagement · May–Jul 2017",
    href: upworkProfileUrl,
    platform: "Upwork",
  },
  {
    quote:
      "Ahmed is your go-to man for anything to do with OpenCart. He is one of the best in this area.",
    author: "Upwork Client",
    role: "Android Mobile App for OpenCart",
    relation: "Fixed-price · Nov 2017–Jan 2018",
    href: upworkProfileUrl,
    platform: "Upwork",
  },
  {
    quote:
      "Ahmed is very effective and reliable. He delivered a good work on this Ionic development project. I enjoyed working with him and will likely have additional jobs for him in the future.",
    author: "Upwork Client",
    role: "Ionic 3 App Update",
    relation: "14-hour engagement · Dec 2017",
    href: upworkProfileUrl,
    platform: "Upwork",
  },
  {
    quote:
      "Ahmed delivered a very good work on this ionic 3 project. I enjoyed working with Ahmed and will likely have additional jobs for him in the future.",
    author: "Upwork Client",
    role: "Ionic 3 Mobile App",
    relation: "11-hour engagement · Jan 2018",
    href: upworkProfileUrl,
    platform: "Upwork",
  },
  {
    quote:
      "Ahmed is a trusted member of our team. He has always produced top quality work. We will always return to him first when we get more work.",
    author: "Upwork Client",
    role: "Citrix App Layering + Azure POC",
    relation: "115-hour engagement · Sep 2017–Jan 2018",
    href: upworkProfileUrl,
    platform: "Upwork",
  },
];

export const caseStudies = [
  {
    title: "Eagle 6 — Enterprise Cybersecurity Frontend",
    context: "Sr. Frontend Engineer · Feb 2018 – Mar 2022 · Remote",
    problem:
      "Eagle 6 needed a rich, performant frontend for their flagship cybersecurity platform — cloud storage with complex permission models, real-time network monitoring dashboards, organization chart modeling, and collaborative document editing. All modules had to handle enterprise-scale data with role-based access control baked into every interaction.",
    approach:
      "Led frontend implementation across 4 major product modules over 4 years. Built the Cloud Storage module with chunked TUS-protocol uploads for large files, role-based permissions at the file/folder level, and in-browser preview/editing. Re-architected the Organization Chart Modeling tool on GOJS with Akita (Redux/Flux) state management for scalability. Built network-monitoring dashboards with D3, Highcharts, Leaflet, and OSM tiles. Standardized the UI to a responsive, accessible Material Design system. Interviewed and helped hire frontend developers; reviewed code contributions and mentored the team.",
    outcome:
      "Delivered all modules on schedule across 4 years in an Agile team. The Org Chart rewrite produced a more maintainable state architecture that the team extended for 3+ years. The accessible Material Design system became the org-wide UI standard. Multiple modules shipped from concept through deployment with zero production regressions traceable to frontend.",
    tech: [
      "Angular 7+",
      "TypeScript",
      "RxJS",
      "Akita",
      "GOJS",
      "D3",
      "Highcharts",
      "Leaflet/OSM",
      "TUS",
      "SCSS/BEM",
      "Jest",
      "Angular Material",
    ],
    metrics: [
      "4 years on a single product",
      "4 major modules delivered",
      "Hired & mentored frontend team",
      "Standardized org-wide UI system",
    ],
  },
  {
    title: "Microsoft RDS + Citrix App Layering on Azure",
    context: "Solo POC Engineer · Sep 2017 – Jan 2018 · Upwork",
    problem:
      "A repeat Upwork client needed a proof-of-concept integrating Microsoft Remote Desktop Services with Citrix App Layering on Microsoft Azure — a stack I had never touched before. The client needed someone who could learn the entire stack from scratch and deliver a working, documented POC on a fixed timeline.",
    approach:
      "Researched and taught myself Azure infrastructure provisioning, Citrix App Layering architecture, and RDS deployment from official docs and community resources. Built the POC iteratively: provisioned Azure VMs, configured the App Layering appliance, created OS and platform layers, published layered images to RDS session hosts, and documented every step for the client's internal team to reproduce. Delivered incremental progress reviews.",
    outcome:
      "Delivered a fully working, documented POC across a 115-hour engagement. The client returned for follow-on work and rated the engagement 5.0 stars, citing top-quality work and reliability. The documentation became the client team's onboarding reference for the Azure + Citrix stack.",
    tech: [
      "Microsoft Azure",
      "Citrix App Layering",
      "RDS",
      "Windows Server",
      "IIS",
      "PowerShell",
    ],
    metrics: [
      "115-hour engagement",
      "5.0★ client rating",
      "Learned entire stack from scratch",
      "Repeat client — 'trusted team member'",
    ],
  },
  {
    title: "Goggle Hunt — Shopify Dropship Business",
    context: "Solo Founder · May 2017 – Sep 2017 · Founded & Sold",
    problem:
      "Identified a keyword with 600K monthly searches and low competition in the US fashion/sports goggles niche. Needed to validate, build, market, and either scale or exit — all while working full-time as a freelance developer.",
    approach:
      "Stood up a Shopify store with product sourcing, ran Instagram influencer partnerships and Gleam giveaway competitions to build an audience, created and managed 4 social media accounts, built a Facebook Merchant storefront for frictionless purchasing, and collected ~150 email subscribers. Ran day-to-day operations, marketing, and product sourcing solo for 4 months.",
    outcome:
      "Built a functional dropship business from zero, validated the market, grew a small but engaged audience, and successfully sold the full business on Flippa to focus exclusively on a software engineering career.",
    tech: ["Shopify", "Gleam", "Instagram", "Facebook Merchant", "Flippa"],
    metrics: [
      "600K/mo search keyword",
      "150 email subscribers",
      "4 social media accounts",
      "Sold on Flippa",
    ],
  },
  {
    title: "Webhook Debugger & Logger v3",
    context: "Solo OSS Maintainer · 2025–Present · Show HN",
    problem:
      "Developers debugging webhook integrations waste hours setting up tunnels, tailing logs, and manually replaying requests. Existing tools were either SaaS-locked, limited to capture-only, or lacked replay/forward/validation workflows. Teams needed an open-source, self-hosted tool that could capture, inspect, replay, forward, validate, and mock webhook traffic — all in one place.",
    approach:
      "Designed and built a complete v3 rewrite in TypeScript with SSE streaming for real-time capture, a replay engine with loop support, JSON Schema + HMAC signature validation, request forwarding with header transformation, a mock server for testing, and a zero-dependency approach to keep install friction low. Shipped with a CLI, programmatic API, and Docker support. Launched on Show HN, published articles on dev.to, and listed on Apify as a webhook testing utility.",
    outcome:
      "Featured on Show HN front page. Published 4+ technical articles. Listed on Apify marketplace. Used by developers testing Stripe, GitHub, Shopify, and custom webhook integrations. The v3 rewrite reduced the codebase surface by 40% while adding 5 major features — capture, replay, forward, validate, and mock — in a single install.",
    tech: [
      "TypeScript",
      "Node.js",
      "SSE",
      "JSON Schema",
      "HMAC",
      "Docker",
      "CLI",
    ],
    metrics: [
      "Show HN front page",
      "5-in-1 tool (capture/replay/forward/validate/mock)",
      "40% codebase reduction in v3",
      "Apify marketplace listed",
    ],
  },
];

export const featuredProjects = [
  {
    name: "agent-harness",
    status: "Priority #1 · Agent tooling",
    visual: "AI Agents · CLI · Host Wiring",
    accent: "accent-agents",
    href: "https://github.com/ar27111994/agent-harness",
    summary:
      "Node.js / TypeScript CLI for discovering, staging, activating, and wiring reusable AI-agent assets across VS Code/Copilot, OpenCode, Cursor, Zed, Claude Code, and Pi.",
    highlights: [
      "Reusable agent-asset lifecycle",
      "Host-aware activation and wiring",
      "Public writing on agent workflow design",
    ],
  },
  {
    name: "Webhook Debugger and Logger",
    status: "Priority #2 · Webhook tooling",
    visual: "Capture · Replay · Verify",
    accent: "accent-capture",
    href: "https://github.com/ar27111994/webhook-debugger-logger",
    summary:
      "Enterprise-grade webhook testing suite for capturing, inspecting, replaying, forwarding, validating, and mocking webhook traffic in real time without persistent tunnels.",
    highlights: [
      "SSE streaming and replay loops",
      "JSON Schema + signature verification",
      "Show HN, Apify, and article proof",
    ],
  },
  {
    name: "penpot-mcp",
    status: "Priority #3 · Design-to-code agents",
    visual: "Penpot · MCP · Design Systems",
    accent: "accent-design",
    href: "https://github.com/ar27111994/penpot-mcp",
    summary:
      "AI-agent skill for creating, auditing, and maintaining Penpot design systems, prototypes, tokens, and design-to-code workflows via MCP.",
    highlights: [
      "Open-source design tooling",
      "Agent skill packaging",
      "Design system and prototype maintenance",
    ],
  },
  {
    name: "antigravity-awesome-skills",
    status: "Agent skill curation",
    visual: "Skills · Claude · Cursor",
    accent: "accent-skills",
    href: "https://github.com/ar27111994/antigravity-awesome-skills",
    summary:
      "Curated collection of 200+ agentic skills for Claude Code / Antigravity / Cursor-style AI-agent workflows.",
    highlights: [
      "Skill curation",
      "Agent workflow packaging",
      "Practical AI-development assets",
    ],
  },
];

export const additionalProjects = [
  {
    name: "Aesthetic Palettes",
    href: "https://github.com/ar27111994/Aesthetic-Palettes",
    description:
      "Open-source color palette generator focused on WCAG-aware visual tooling, typography, UX research, and zero-cost infrastructure.",
  },
  {
    name: "code-the-countdown",
    href: "https://github.com/ar27111994/code-the-countdown",
    description:
      "Google I/O 2026 Code the Countdown challenge project using TypeScript, React/Next.js, canvas, motion, Web Audio, and WebGL-oriented UI work.",
  },
  {
    name: "InterActNote",
    href: "https://github.com/ar27111994/InterActNote",
    description:
      "Android-first call-time context and relationship notes product focused on useful, practical in-call context.",
  },
  {
    name: "DataGuard",
    href: `mailto:${contactEmail}?subject=DataGuard`,
    description:
      "Data quality and ETL validation product direction for CSV, Excel, JSON, and structured-data workflows.",
  },
];

export const writingLinks = [
  {
    label: "Agent assets need a lifecycle, not a dumping ground",
    href: "https://dev.to/ar27111994/agent-assets-need-a-lifecycle-not-a-dumping-ground-1i3h",
    source: "Dev.to",
    date: "May 2026",
    tag: "Agent tooling",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label: "I built a more restrained alternative to giant AI skill bundles",
    href: "https://dev.to/ar27111994/i-built-a-more-restrained-alternative-to-giant-ai-skill-bundles-1kf5",
    source: "Dev.to",
    date: "May 2026",
    tag: "AI workflows",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label: "Fixing Google Antigravity Pro Authentication on Windows 10 + WSL2",
    href: "https://dev.to/ar27111994/fixing-google-antigravity-pro-authentication-on-windows-10-wsl2-45jd",
    source: "Dev.to",
    date: "Jan 2026",
    tag: "Debugging",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label:
      "Stop paying for webhook debuggers. I built a better one (Open Source).",
    href: "https://dev.to/ar27111994/stop-paying-for-webhook-debuggers-i-built-a-better-one-open-source-dcl",
    source: "Dev.to",
    date: "Jan 2026",
    tag: "Webhooks",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label: "How to Debug Webhook Integrations in Minutes",
    href: "https://dev.to/ar27111994/how-to-debug-webhook-integrations-in-minutes-step-by-step-guide-3ccf",
    source: "Dev.to",
    date: "Dec 2025",
    tag: "Webhook guide",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label:
      "Show HN: Webhook Debugger — OS Alternative to RequestBin with Replay, SSRF Checks",
    href: "https://news.ycombinator.com/item?id=46632472",
    source: "Hacker News",
    date: "Jan 2026",
    tag: "Launch proof",
    icon: "/brand-icons/ycombinator.svg",
  },
];

export const feedSources = [
  {
    label: "Dev.to articles",
    href: "https://dev.to/feed/ar27111994",
    type: "RSS",
    icon: "/brand-icons/devdotto.svg",
  },
  {
    label: "Medium / ARLabs",
    href: "https://medium.com/feed/@arlabs",
    type: "RSS",
    icon: "/brand-icons/medium.svg",
  },
  {
    label: "Hashnode",
    href: "https://hashnode.com/@ar27111994",
    type: "Profile",
    icon: "/brand-icons/hashnode.svg",
  },
  {
    label: "GitHub repos",
    href: "https://api.github.com/users/ar27111994/repos?sort=updated",
    type: "API",
    icon: "/brand-icons/github.svg",
  },
  {
    label: "GitHub gists",
    href: "https://api.github.com/users/ar27111994/gists",
    type: "API",
    icon: "/brand-icons/github.svg",
  },
  {
    label: "Hacker News",
    href: "https://news.ycombinator.com/user?id=ar27111994",
    type: "Profile",
    icon: "/brand-icons/ycombinator.svg",
  },
  {
    label: "Product Hunt",
    href: "https://www.producthunt.com/@ar27111994",
    type: "Profile",
    icon: "/brand-icons/producthunt.svg",
  },
  {
    label: "X/Twitter",
    href: "https://x.com/ar27111994",
    type: "Social",
    icon: "/brand-icons/x.svg",
  },
];

export const labNotes = [
  {
    title: "Integration reliability lab",
    body: "Webhook debugging, replay safety, provider-specific diagnosis, and incident artifacts for external integrations that fail in messy real-world ways.",
  },
  {
    title: "Agent workflow lab",
    body: "Reusable skills, prompts, host-aware agent assets, and lifecycle tooling so AI-assisted development does not become another dumping ground.",
  },
  {
    title: "Automation systems lab",
    body: "Small internal tools, scripts, dashboards, and workflow utilities that are observable, maintainable, and boring in the right places.",
  },
  {
    title: "Product surface lab",
    body: "Portfolio, docs, launch pages, resumes, and proof surfaces polished for speed, clarity, accessibility, SEO, and trust.",
  },
];

export const contactWidgets = [
  {
    kind: "email",
    label: "Primary email",
    value: contactEmail,
    detail: "Best for project briefs, partnerships, and longer context.",
    href: `mailto:${contactEmail}`,
    icon: "/brand-icons/gmail.svg",
  },
  {
    kind: "email secondary-email",
    label: "Direct email",
    value: secondaryEmail,
    detail:
      "Additional direct inbox for portfolio, Upwork, and collaboration context.",
    href: `mailto:${secondaryEmail}`,
    icon: "/brand-icons/gmail.svg",
  },
  {
    kind: "whatsapp",
    label: "WhatsApp",
    value: "+92 331 588 7235",
    detail: "Fast async contact for focused devtools / automation work.",
    href: whatsappUrl,
    icon: "/brand-icons/whatsapp.svg",
  },
];

export const resumeWidgets = [
  {
    label: "Full resume",
    badge: "Comprehensive",
    href: "/resume/resume_full.pdf",
    detail:
      "Best default: full project, education, certification, and OSS/freemium depth.",
    icon: "/brand-icons/adobeacrobatreader.svg",
  },
  {
    label: "Client/Freelance resume",
    badge: "Client-facing",
    href: "/resume/resume_client_freelance.pdf",
    detail:
      "Trimmed for freelance/project work, delivery credibility, and practical technical scope.",
    icon: "/brand-icons/adobeacrobatreader.svg",
  },
  {
    label: "One-page resume",
    badge: "Fast scan",
    href: "/resume/resume_one_page.pdf",
    detail: "Compact version for quick screening and general applications.",
    icon: "/brand-icons/adobeacrobatreader.svg",
  },
];

export const profileWidgets = [
  {
    label: "GitHub",
    href: "https://github.com/ar27111994",
    icon: "/brand-icons/github.svg",
    detail: "Strongest technical proof surface",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/ar27111994",
    icon: "/brand-icons/linkedin.svg",
    detail: "Professional credibility",
  },
  {
    label: "Upwork",
    href: upworkProfileUrl,
    icon: "/brand-icons/upwork.svg",
    detail: "Client acquisition surface",
  },
  {
    label: "Product Hunt",
    href: "https://www.producthunt.com/@ar27111994",
    icon: "/brand-icons/producthunt.svg",
    detail: "Launch and product proof",
  },
  {
    label: "Stack Overflow",
    href: "https://stackoverflow.com/users/3841610/ar27111994",
    icon: "/brand-icons/stackoverflow.svg",
    detail: "Developer-community history",
  },
  {
    label: "Hacker News",
    href: "https://news.ycombinator.com/user?id=ar27111994",
    icon: "/brand-icons/ycombinator.svg",
    detail: "Launch/discussion proof",
  },
];

export const upworkProofCards = [
  {
    label: "Client fit",
    value: "Full-stack delivery for tools, dashboards, APIs, and automation",
    detail:
      "Best fit for teams that need a practical builder who can turn messy workflows into usable, documented software.",
  },
  {
    label: "Delivery style",
    value: "Async-friendly, artifact-driven, low-drama execution",
    detail:
      "Clear written updates, concrete demos, and handoff-friendly work instead of vague progress reports.",
  },
  {
    label: "Portfolio depth",
    value: `${upworkPortfolioCount} shipped examples across old and new work`,
    detail:
      "A long work trail spanning devtools, enterprise frontend, CMS/e-commerce, dashboards, integrations, and product surfaces.",
  },
  {
    label: "Recent proof",
    value: recentUpworkProofTitles,
    detail:
      "Newest featured profile work, emphasizing developer tools, AI-agent workflows, webhooks, and polished public surfaces.",
  },
];

export const upworkFitTags = [
  "Developer tools",
  "Webhook APIs",
  "Dashboards",
  "Automation",
  "AI-agent tooling",
  "Fast UI",
  "Async delivery",
  "Production-ready",
];

export const capabilities = [
  {
    title: "Developer tools and internal platform tooling",
    icon: "/brand-icons/github.svg",
    cue: "Tooling",
  },
  {
    title: "Webhook/API workflows and debugging systems",
    mark: "API",
    cue: "Integrations",
  },
  {
    title: "Automation-heavy product architecture",
    mark: "AUTO",
    cue: "Systems",
  },
  {
    title: "AI-assisted product workflows and agent tooling",
    icon: "/brand-icons/anthropic.svg",
    cue: "Agents",
  },
  {
    title: "Design-to-code and MCP skill workflows",
    mark: "MCP",
    cue: "Design systems",
  },
  {
    title: "Performance-conscious full-stack engineering",
    mark: "PERF",
    cue: "Frontend + backend",
  },
  {
    title: "Production-focused build and delivery execution",
    mark: "SHIP",
    cue: "Launch-ready",
  },
  {
    title: "Security-sensitive defaults for tooling that touches user traffic",
    mark: "SEC",
    cue: "Trust defaults",
  },
];

export const credibilityFacts = [
  {
    icon: yearsLabel,
    text: `${yearsLabel} years across enterprise, freelance, founder, and solo-builder execution`,
  },
  {
    icon: "UX",
    text: "Built complex workflow-heavy modules: permissions, documents, uploads, graphs, maps, and org charts",
  },
  {
    icon: "AI",
    text: "Current focus: devtools, webhooks, agent systems, automation, and design-to-code workflows",
  },
  {
    icon: "MS",
    text: "Microsoft Partner and Anthropic Partner identity via admin@ar27111994.dev",
  },
];

export const ventureProof = [
  {
    label: "Goggle Hunt exit listing (Flippa)",
    href: "https://flippa.com/9034806-your-one-stop-shop-for-fashion-and-sports-goggles",
    icon: "/brand-icons/flippa.svg",
  },
  {
    label: "Gleam competition platform used for subscriber campaigns",
    href: "https://gleam.io/",
    icon: "/brand-icons/gleam.svg",
  },
  {
    label: "Upwork freelance profile",
    href: upworkProfileUrl,
    icon: "/brand-icons/upwork.svg",
  },
];

export const certificationLinks = [
  {
    label: "Anthropic — Building with the Claude API (Jun 2026)",
    href: "https://verify.skilljar.com/c/kqdnoajm977y",
    pdf: "/certifications/certificate-kqdnoajm977y-1781164088.pdf",
    issuer: "Anthropic",
    icon: "/brand-icons/anthropic.svg",
  },
  {
    label: "Anthropic — Claude Code in Action (Jun 2026)",
    href: "https://verify.skilljar.com/c/gv2gvaw48jus",
    pdf: "/certifications/certificate-gv2gvaw48jus-1781175930.pdf",
    issuer: "Anthropic",
    icon: "/brand-icons/anthropic.svg",
  },
  {
    label: "Anthropic — Introduction to Agent Skills (May 2026)",
    href: "https://verify.skilljar.com/c/8wqzsm9q9o9w",
    pdf: "/certifications/certificate-8wqzsm9q9o9w-1781022441.pdf",
    issuer: "Anthropic",
    icon: "/brand-icons/anthropic.svg",
  },
  {
    label: "Anthropic — Introduction to Model Context Protocol (Jun 2026)",
    href: "https://verify.skilljar.com/c/nhscqtess3nq",
    pdf: "/certifications/certificate-nhscqtess3nq-1781167218.pdf",
    issuer: "Anthropic",
    icon: "/brand-icons/anthropic.svg",
  },
  {
    label: "Coursera Certificate (12/05/2019) — ML Strategy & Error Analysis",
    href: "https://www.coursera.org/account/accomplishments/verify/HQ3883739EQ7",
    issuer: "Coursera",
    icon: "/brand-icons/coursera.svg",
  },
  {
    label:
      "Coursera Certificate (07/04/2019) — Deep Learning Best Practices & Optimization",
    href: "https://www.coursera.org/account/accomplishments/verify/U4QYCQLM9WUH",
    issuer: "Coursera",
    icon: "/brand-icons/coursera.svg",
  },
  {
    label:
      "Coursera Certificate (20/08/2018) — Deep Learning Foundations + TensorFlow",
    href: "https://www.coursera.org/account/accomplishments/verify/TDDMYNV57A99",
    issuer: "Coursera",
    icon: "/brand-icons/coursera.svg",
  },
  {
    label: "Coursera Certificate (29/10/2018) — Big Data Fundamentals + Hadoop",
    href: "https://www.coursera.org/account/accomplishments/verify/HHVS4SJNXDR8",
    issuer: "Coursera",
    icon: "/brand-icons/coursera.svg",
  },
];

export const openSourceFreemium = [
  {
    label: "OpenCart 3.x extension listing",
    href: "https://www.opencart.com/index.php?route=marketplace/extension/info&extension_id=33156",
  },
  {
    label: "Mosaico CodeIgniter integration",
    href: "https://github.com/ar27111994/Mosaico-CodeIgniter-Ion-Auth",
  },
  {
    label: "National Criminals Database",
    href: "https://github.com/ar27111994/National-Criminals-Database",
  },
  {
    label: "OpenBiz CRUD Scaffolding Templates",
    href: "https://github.com/ar27111994/OpenBiz-CRUD-Scaffolding-Templates",
  },
  { label: "OpenBiz", href: "https://github.com/ar27111994/OpenBiz" },
  {
    label: "Generic Repository Pattern",
    href: "https://github.com/ar27111994/Generic-Repository-Pattern",
  },
  { label: "Bookstore", href: "https://github.com/ar27111994/bookstore" },
  {
    label: "ShoppingCartLibraryv1.0",
    href: "https://github.com/ar27111994/ShoppingCartLibraryv1.0",
  },
];

export const sponsorLinks = [
  {
    label: "Patreon",
    href: "https://www.patreon.com/cw/ar27111994",
    note: "Recurring support + roadmap voting",
    icon: "/brand-icons/patreon.svg",
  },
  {
    label: "Ko-fi",
    href: "https://ko-fi.com/ar27111994",
    note: "One-time or monthly support",
    icon: "/brand-icons/kofi.svg",
  },
  {
    label: "Liberapay",
    href: "https://liberapay.com/ar27111994",
    note: "Open recurring sponsorship",
    icon: "/brand-icons/liberapay.svg",
  },
  {
    label: "Buy Me a Coffee",
    href: "https://buymeacoffee.com/ar27111994",
    note: "Quick contribution for maintenance",
    icon: "/brand-icons/buymeacoffee.svg",
  },
  {
    label: "thanks.dev",
    href: "https://thanks.dev/d/gh/ar27111994",
    note: "Sponsor through dependency tooling ecosystem",
    icon: "/brand-icons/thanksdotdev.png",
  },
];
