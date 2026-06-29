export interface UpworkPortfolioAttachment {
  uid?: string | null;
  type?: string | null;
  provider?: string | null;
  title?: string | null;
  description?: string | null;
  rank?: number | null;
  url?: string | null;
  embeddedUrl?: string | null;
  originalUrl?: string | null;
  thumbnail?: string | null;
  localImage?: string | null;
  videoId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  imageSmall?: string | null;
  imageMiddle?: string | null;
  imageLarge?: string | null;
  image?: {
    large?: string | null;
    medium?: string | null;
    small?: string | null;
  } | null;
}

export interface UpworkPortfolioItem {
  id: string;
  title: string;
  role?: string | null;
  description: string;
  displayDescription?: string;
  projectGoal?: string | null;
  solution?: string | null;
  skills?: string[] | null;
  url?: string | null;
  thumbnail?: string | null;
  thumbnailOriginal?: string | null;
  completionDate?: string | null;
  featured?: boolean | null;
  sourcePage?: number | null;
  rank?: number | null;
  mediaCounts?: Record<string, number> | null;
  attachments?: UpworkPortfolioAttachment[] | null;
}

export interface PortfolioDisplayMeta {
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

export interface UpworkPortfolioData {
  items: UpworkPortfolioItem[];
  profileUrl: string;
  [key: string]: unknown;
}

export function buildUpworkPortfolioDisplay(
  upworkPortfolio: UpworkPortfolioData,
) {
  const upworkPortfolioItems = (
    upworkPortfolio.items as unknown as UpworkPortfolioItem[]
  )
    .map((item) => ({
      ...item,
      displayDescription:
        portfolioDisplayMeta[item.title]?.description ?? item.description,
      skills: item.skills?.length
        ? item.skills
        : (portfolioDisplayMeta[item.title]?.skills ??
          inferPortfolioTags(item)),
    }))
    // Sort latest completionDate first; items with no date go to the end
    .sort((a, b) => {
      const da = a.completionDate ? new Date(a.completionDate).getTime() : 0;
      const db = b.completionDate ? new Date(b.completionDate).getTime() : 0;
      return db - da;
    });
  const upworkPortfolioCount = upworkPortfolioItems.length;
  // If the JSON has exactly 20 items it was written by the official API (capped
  // at 20 by Upwork API-598). Show "20+" to signal more exist on the live profile.
  // If a browser-session fetch has populated more items, use the real count.
  const UPWORK_API_CAP = 20;
  const upworkPortfolioCountLabel =
    upworkPortfolioCount === UPWORK_API_CAP
      ? `${upworkPortfolioCount}+`
      : String(upworkPortfolioCount);
  const recentUpworkProofItems = upworkPortfolioItems
    .filter((item) => item.featured)
    .slice(0, 4);
  const recentUpworkProofTitles = (
    recentUpworkProofItems.length
      ? recentUpworkProofItems
      : upworkPortfolioItems.slice(0, 4)
  )
    .map((item) => item.title)
    .join(" · ");
  return {
    items: upworkPortfolioItems,
    count: upworkPortfolioCount,
    countLabel: upworkPortfolioCountLabel,
    recentProofItems: recentUpworkProofItems,
    recentProofTitles: recentUpworkProofTitles,
  };
}
