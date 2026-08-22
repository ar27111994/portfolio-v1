/**
 * MCP discovery manifests for this domain (see SEP-1960 / SEP-1649).
 * Shared by the /.well-known/mcp and /.well-known/mcp.json endpoints so the
 * two documented discovery paths agree by construction.
 */

export const MCP_ENDPOINT_URL = "https://www.ar27111994.dev/mcp";

export const mcpManifest = {
  schema: "https://spec.modelcontextprotocol.io/specification/2025-06-18/",
  name: "ar27111994.dev",
  title: "Ahmed Rehan — ARLabs portfolio data",
  description:
    "First-party MCP server exposing Ahmed Rehan's portfolio, projects, case studies, services, certifications, and contact data as read-only tools.",
  endpoints: {
    streamable_http: MCP_ENDPOINT_URL,
  },
  capabilities: {
    tools: true,
    resources: false,
    prompts: false,
    streamable_http: true,
    sse: false,
    websocket: false,
  },
  authentication: {
    required: false,
    methods: [],
  },
  security: {
    tls: true,
    security_contact: "admin@ar27111994.dev",
  },
} as const;

export function mcpManifestResponse(): Response {
  return new Response(JSON.stringify(mcpManifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
