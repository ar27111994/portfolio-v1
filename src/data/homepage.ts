export interface HomepageContentArgs {
  contactEmail: string;
  secondaryEmail: string;
  whatsappUrl: string;
  upworkProfileUrl: string;
  yearsLabel: string;
  ghPublicRepos: string;
  ghTotalStars: string;
  upworkPortfolioCount: number;
  recentUpworkProofTitles: string;
}

export function getHomepageContent(args: HomepageContentArgs) {
  const {
    contactEmail,
    secondaryEmail,
    whatsappUrl,
    upworkProfileUrl,
    yearsLabel,
    ghPublicRepos,
    ghTotalStars,
    upworkPortfolioCount,
    recentUpworkProofTitles,
  } = args;

  const profileLinks = [
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
  ];

  const badges = [
    { label: "Anthropic course track", icon: "/brand-icons/anthropic.svg" },
    {
      label: "Open-source maintainer",
      icon: "/brand-icons/opensourceinitiative.svg",
    },
    { label: "Enterprise delivery", mark: "B2B" },
    { label: "Devtools builder", icon: "/brand-icons/github.svg" },
    { label: "Webhook/API tooling", mark: "API" },
    { label: "Productivity systems", mark: "FLOW" },
    { label: "Remote / async ready", mark: "↗" },
    { label: "Reliability-first shipping", mark: "✓" },
  ];

  const proofStackMetrics = [
    {
      value: yearsLabel,
      label: "years",
      detail: "enterprise, freelance, founder, solo builds",
    },
    {
      value: ghPublicRepos,
      label: "public repos",
      detail: "build-time GitHub snapshot refreshed during deploys",
      stat: "githubRepos",
    },
    {
      value: ghTotalStars,
      label: "GH stars",
      detail: "build-time GitHub snapshot refreshed during deploys",
      stat: "githubStars",
    },
  ];

  const caseStudies = [
    {
      title: "Webhook Debugger and Logger",
      tag: "Webhook tooling",
      problem:
        "Webhook debugging usually depends on brittle tunnels, weak inspection, or paid tools that are overkill for small teams and internal integration work.",
      approach:
        "I built an open-source webhook suite around live capture, replay, forwarding, schema validation, and provider signature verification so teams can debug real traffic without changing their whole workflow.",
      outcome:
        "25 GitHub stars, 3 forks, a published v3.0.5 release, and public launch/writing proof across Dev.to and Hacker News.",
      metrics: ["25 stars", "3 forks", "Latest release: v3.0.5"],
      links: [
        {
          label: "GitHub repo",
          href: "https://github.com/ar27111994/webhook-debugger-logger",
        },
        {
          label: "Show HN launch",
          href: "https://news.ycombinator.com/item?id=46632472",
        },
      ],
    },
    {
      title: "agent-harness",
      tag: "AI-agent tooling",
      problem:
        "Agent workflows break down when reusable assets, prompts, skills, and host-specific setup all live as undocumented one-offs across multiple coding environments.",
      approach:
        "I built a TypeScript CLI that stages, activates, and wires reusable agent assets across major hosts so the same workflow can be reused instead of rebuilt host by host.",
      outcome:
        "Public support for 6 major coding hosts plus 3 GitHub stars and 1 fork — enough proof to show the tool is real, portable, and actively maintained in public.",
      metrics: ["6 supported hosts", "3 stars", "1 fork"],
      links: [
        {
          label: "GitHub repo",
          href: "https://github.com/ar27111994/agent-harness",
        },
        {
          label: "Dev.to write-up",
          href: "https://dev.to/ar27111994/agent-assets-need-a-lifecycle-not-a-dumping-ground-1i3h",
        },
      ],
    },
    {
      title: "penpot-mcp",
      tag: "Design-to-code workflow",
      problem:
        "Design systems and Penpot handoff work often fall apart when design assets, tokens, and agent tooling are not connected into one maintainable workflow.",
      approach:
        "I packaged the Penpot MCP workflow into an agent-facing skill that covers design-system maintenance, prototype support, and design-to-code operations around the official Penpot MCP surface.",
      outcome:
        "9 GitHub stars and 2 forks on a narrow specialist tool — enough signal that the workflow solves a real cross-disciplinary problem for design-aware agent work.",
      metrics: ["9 stars", "2 forks", "Official MCP workflow"],
      links: [
        {
          label: "GitHub repo",
          href: "https://github.com/ar27111994/penpot-mcp",
        },
        {
          label: "Upwork portfolio card",
          href: "https://www.upwork.com/freelancers/~0188baee67e8f543e7",
        },
      ],
    },
  ];

  const featuredProjects = [
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

  const additionalProjects = [
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

  const writingLinks = [
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
      label:
        "Fixing Google Antigravity Pro Authentication on Windows 10 + WSL2",
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

  const feedSources = [
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

  const labNotes = [
    {
      title: "Webhook and API debugging",
      body: "Fix brittle webhook flows, provider edge cases, replay/verification gaps, and the operational blind spots that make integrations hard to trust.",
    },
    {
      title: "Internal tools and workflow automation",
      body: "Build focused dashboards, admin surfaces, and small operational tools that remove repetitive work without turning into a giant platform project.",
    },
    {
      title: "AI-agent and developer tooling",
      body: "Design host-aware agent workflows, reusable skills, CLIs, and supporting docs that stay maintainable after the first demo.",
    },
    {
      title: "Performance, UX, and launch-surface cleanup",
      body: "Tighten public product surfaces, docs, and portfolio pages so they load faster, read more clearly, and earn trust sooner.",
    },
  ];

  const engagementSteps = [
    {
      step: "01",
      title: "Send the brief",
      body: "Share the product problem, current stack, constraints, and what success looks like. Email is best when the context is long or messy.",
    },
    {
      step: "02",
      title: "I turn it into a plan",
      body: "I narrow the problem into a concrete scope, tradeoffs, and the fastest sane path so the work is understandable before code starts moving.",
    },
    {
      step: "03",
      title: "Ship in verified slices",
      body: "Implementation happens in small, testable chunks with demos, written context, and handoff notes instead of vague progress claims.",
    },
  ];

  const contactWidgets = [
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

  const resumeWidgets = [
    {
      label: "Full resume",
      badge: "Comprehensive",
      href: "/resume/resume_full.pdf",
      detail:
        "Comprehensive depth for direct review, now kept photo-free and single-column for stronger ATS compatibility too.",
      icon: "/brand-icons/adobeacrobatreader.svg",
    },
    {
      label: "ATS resume",
      badge: "ATS-safe default",
      href: "/resume/resume.pdf",
      detail:
        "Photo-free, single-column, US-Letter export for general applications and parser-heavy hiring flows.",
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
      detail: "Compact version for quick screening and warm introductions.",
      icon: "/brand-icons/adobeacrobatreader.svg",
    },
  ];

  const profileWidgets = [
    {
      label: "GitHub",
      href: "https://github.com/ar27111994",
      icon: "/brand-icons/github.svg",
      detail: "Strongest public code and shipping signal",
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
      detail: "Client history and portfolio",
    },
    {
      label: "Product Hunt",
      href: "https://www.producthunt.com/@ar27111994",
      icon: "/brand-icons/producthunt.svg",
      detail: "Launch history and product signal",
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
      detail: "Launch and discussion trail",
    },
  ];

  const upworkProofCards = [
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

  const upworkFitTags = [
    "Developer tools",
    "Webhook APIs",
    "Dashboards",
    "Automation",
    "AI-agent tooling",
    "Fast UI",
    "Async delivery",
    "Production-ready",
  ];

  const testimonialCards = [
    {
      source: "LinkedIn recommendation",
      sourceKind: "linkedin",
      featured: true,
      quote:
        "Ahmed exemplifies everything a company would need in a Frontend Developer: Collaborative, Critical Thinker, Open to Suggestions, Hard Worker, and Extremely Knowledgeable.",
      author: "Reilly Gray, CLTL",
      role: "Scrum Master II · managed Ahmed directly at EAGLE6",
      context: "April 2022 recommendation",
      href: "https://www.linkedin.com/in/reilly-gray-cltl-930097136/",
      cta: "Open LinkedIn profile",
    },
    {
      source: "LinkedIn recommendation",
      sourceKind: "linkedin",
      featured: true,
      quote:
        "I have had the pleasure of working as Ahmed’s business analyst and product manager for 2 years at EAGLE6 and witnessed Ahmed create desirable and innovative UI solutions to complex cyber security problems, on schedule without fail.",
      author: "Donovan Mosley",
      role: "Product Manager / Business Analyst · worked with Ahmed at EAGLE6",
      context: "October 2021 recommendation",
      href: "https://www.linkedin.com/in/donovanmosley/",
      cta: "Open LinkedIn profile",
    },
    {
      source: "Upwork client review · 5.0 / 5",
      sourceKind: "upwork",
      quote:
        "Ahmed's work on our project was outstanding. His communication was top-notch, he met all deadlines, and his skills were exceptionally strong.",
      author: "Need help with Grocery CRUD",
      role: "Upwork client review",
      context: "61 hours · $304.17 earned · May–Jul 2017",
      href: upworkProfileUrl,
      cta: "Open Upwork profile",
    },
    {
      source: "Upwork client review · 5.0 / 5",
      sourceKind: "upwork",
      quote:
        "Ahmed is a trusted member of our team. He has always produced top quality work. We will always return to him first when we get more work.",
      author: "POC Needed for Citrix App Layering and Azure",
      role: "Upwork client review",
      context: "115 hours · $576.68 earned · Sep 2017–Jan 2018",
      href: upworkProfileUrl,
      cta: "Open Upwork profile",
    },
    {
      source: "Upwork client review · 5.0 / 5",
      sourceKind: "upwork",
      quote:
        "Ahmed is your go-to man for anything to do with OpenCart. He is one of the best in this area.",
      author: "Android Mobile App for OpenCart",
      role: "Upwork client review",
      context: "$850 fixed price · Nov 2017–Jan 2018",
      href: upworkProfileUrl,
      cta: "Open Upwork profile",
    },
  ];

  const capabilities = [
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
      title:
        "Security-sensitive defaults for tooling that touches user traffic",
      mark: "SEC",
      cue: "Trust defaults",
    },
  ];

  const credibilityFacts = [
    {
      icon: yearsLabel,
      text: `${yearsLabel} years across enterprise, freelance, founder, and solo-builder delivery`,
    },
    {
      icon: "SYS",
      text: "Hands-on work across workflow-heavy systems: permissions, documents, uploads, graphs, maps, and internal operations surfaces.",
    },
    {
      icon: "SHIP",
      text: "Current focus: devtools, webhook/API workflows, automation, and AI-agent tooling that still needs strong UX and handoff quality.",
    },
    {
      icon: "CERT",
      text: "Public training, OSS history, and long-lived proof links are collected below instead of hidden behind vague claims.",
    },
  ];

  const ventureProof = [
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

  const certificationLinks = [
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
      label:
        "Coursera Certificate (29/10/2018) — Big Data Fundamentals + Hadoop",
      href: "https://www.coursera.org/account/accomplishments/verify/HHVS4SJNXDR8",
      issuer: "Coursera",
      icon: "/brand-icons/coursera.svg",
    },
  ];

  const openSourceFreemium = [
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

  const sponsorLinks = [
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

  return {
    profileLinks,
    badges,
    proofStackMetrics,
    caseStudies,
    featuredProjects,
    additionalProjects,
    writingLinks,
    feedSources,
    labNotes,
    engagementSteps,
    contactWidgets,
    resumeWidgets,
    profileWidgets,
    upworkProofCards,
    upworkFitTags,
    testimonialCards,
    capabilities,
    credibilityFacts,
    ventureProof,
    certificationLinks,
    openSourceFreemium,
    sponsorLinks,
  };
}

export type HomepageContent = ReturnType<typeof getHomepageContent>;
