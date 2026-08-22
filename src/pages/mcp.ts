/**
 * Model Context Protocol endpoint — Streamable HTTP transport (2025-06-18).
 *
 * Served at https://www.ar27111994.dev/mcp and advertised from
 * /.well-known/mcp (SEP-1960 manifest) and /.well-known/mcp/server-card.json
 * (SEP-1649 server card). Read-only: exposes the portfolio's real data as
 * tools so any MCP client can query it natively.
 *
 * HTTP contract (spec "Streamable HTTP"):
 * - POST: JSON-RPC request/notification, responds application/json (200) or
 *   202 Accepted (notifications) or 400 (invalid), 403 (bad Origin).
 * - GET: 405 Method Not Allowed (no SSE stream offered).
 * - Origin validated for DNS-rebinding protection; stateless (no session).
 */
import type { APIRoute } from "astro";
import {
  dispatchMcpMessage,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "../lib/mcp/protocol";
import type { McpDataProvider, McpTool } from "../lib/mcp/protocol";
import { isAllowedMcpHost, isAllowedMcpOrigin } from "../lib/mcp/security";
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
  upworkPortfolioItems,
  upworkPortfolioCount,
  upworkPortfolioCountLabel,
  profileLinks,
  resumeWidgets,
  contactWidgets,
  writingLinks,
  feedSources,
  proofStackMetrics,
} from "../data/site-content";

export const prerender = false;

const ERROR_PARSE = -32700;

function tool(
  name: string,
  description: string,
  inputSchema?: Record<string, unknown>,
): McpTool {
  return inputSchema
    ? { name, description, inputSchema }
    : { name, description };
}

const provider: McpDataProvider = {
  tools: () => [
    tool(
      "get_portfolio_overview",
      "High-level summary of Ahmed Rehan: role, experience, focus areas, portfolio size, and availability surface.",
    ),
    tool(
      "list_services",
      "List the services Ahmed offers (developer tools, webhook debugging/automation, agentic systems and tooling).",
    ),
    tool(
      "list_featured_projects",
      "List featured and additional open-source projects with descriptions, highlights, and repository links.",
    ),
    tool(
      "list_case_studies",
      "List detailed case studies (context, problem, approach, outcome, tech stack, metrics).",
    ),
    tool(
      "list_capabilities",
      "List professional capabilities and specialization areas.",
    ),
    tool(
      "list_certifications",
      "List verifiable certifications with verification links.",
    ),
    tool(
      "list_upwork_portfolio",
      "List recorded Upwork portfolio items (title, completion date, skills, description, project link).",
      {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum items to return (default 100)",
          },
        },
      },
    ),
    tool(
      "get_contact_info",
      "Get contact channels (email, WhatsApp) and profile links for reaching Ahmed.",
    ),
    tool(
      "list_resume_downloads",
      "List downloadable resume PDFs with their labels and paths.",
    ),
    tool(
      "list_writing_and_feeds",
      "List published articles and content feed sources.",
    ),
  ],
  call: async (name, args) => {
    switch (name) {
      case "get_portfolio_overview":
        return {
          name: "Ahmed Rehan",
          studio: "ARLabs",
          location: "Rawalpindi, Pakistan (UTC+5)",
          experienceYears: yearsLabel,
          title:
            "Full-stack Engineer for Devtools, Webhooks, Automation, and AI-Agent Workflows",
          services: servicesOfferings.map((s) => s.title),
          featuredProjectCount: featuredProjects.length,
          caseStudyCount: caseStudies.length,
          certificationCount: certificationLinks.length,
          upworkPortfolioCount,
          upworkPortfolioCountLabel,
          github: proofStackMetrics.map((m) => ({
            label: m.label,
            value: m.value,
            detail: m.detail,
          })),
          contact: contactEmail,
          upworkProfile: upworkProfileUrl,
          website: "https://www.ar27111994.dev",
        };
      case "list_services":
        return servicesOfferings;
      case "list_featured_projects":
        return {
          featured: featuredProjects,
          additional: additionalProjects,
        };
      case "list_case_studies":
        return caseStudies;
      case "list_capabilities":
        return capabilities.map((c) => c.title);
      case "list_certifications":
        return certificationLinks;
      case "list_upwork_portfolio": {
        const limit =
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? Math.max(1, Math.min(100, Math.floor(args.limit)))
            : 100;
        return upworkPortfolioItems.slice(0, limit).map((item) => ({
          id: item.id,
          title: item.title,
          role: item.role ?? undefined,
          completionDate: item.completionDate ?? undefined,
          url: item.url ?? undefined,
          skills: item.skills?.slice(0, 8) ?? [],
          description: item.displayDescription ?? item.description,
        }));
      }
      case "get_contact_info":
        return {
          email: contactEmail,
          secondaryEmail,
          whatsapp: whatsappUrl,
          phone: "+92 331 588 7235",
          location: "Rawalpindi, Pakistan (UTC+5)",
          upworkProfile: upworkProfileUrl,
          profileLinks,
          contactWidgets,
        };
      case "list_resume_downloads":
        return resumeWidgets.map((r) => ({
          label: r.label,
          badge: r.badge,
          url: `https://www.ar27111994.dev${r.href}`,
          detail: r.detail,
        }));
      case "list_writing_and_feeds":
        return { writingLinks, feedSources };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },
};

export const POST: APIRoute = async ({ request }) => {
  // DNS-rebinding / host validation (Streamable HTTP security requirements).
  const hostHeader = request.headers.get("host");
  if (!isAllowedMcpHost(hostHeader)) {
    return new Response("Forbidden", { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (!isAllowedMcpOrigin(origin)) {
    return new Response("Forbidden: disallowed Origin", { status: 403 });
  }

  // Protocol-version header check (invalid/unsupported -> 400).
  const versionHeader = request.headers.get("mcp-protocol-version");
  if (
    versionHeader &&
    !SUPPORTED_PROTOCOL_VERSIONS.includes(versionHeader as never)
  ) {
    return new Response("Unsupported MCP protocol version", { status: 400 });
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return mcpErrorHttp(ERROR_PARSE, "Parse error", null);
  }
  if (!bodyText.trim()) {
    return mcpErrorHttp(ERROR_PARSE, "Parse error", null);
  }

  let message: unknown;
  try {
    message = JSON.parse(bodyText);
  } catch {
    return mcpErrorHttp(ERROR_PARSE, "Parse error", null);
  }
  if (
    !message ||
    typeof message !== "object" ||
    (message as { jsonrpc?: unknown }).jsonrpc !== "2.0"
  ) {
    return mcpErrorHttp(-32600, "Invalid Request", null);
  }

  const outcome = await dispatchMcpMessage(message, provider, versionHeader);

  if (outcome.kind === "ack") {
    return new Response(null, { status: 202 });
  }

  return new Response(JSON.stringify(outcome.message), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      Vary: "Accept",
    },
  });
};

function mcpErrorHttp(
  code: number,
  messageText: string,
  id: string | number | null,
): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message: messageText },
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json", Vary: "Accept" },
    },
  );
}

export const GET: APIRoute = () =>
  new Response("Method Not Allowed: use POST", {
    status: 405,
    headers: { Allow: "POST" },
  });
