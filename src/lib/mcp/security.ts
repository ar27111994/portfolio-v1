/**
 * MCP endpoint request validation (DNS-rebinding / host-origin filtering).
 *
 * The endpoint is read-only public portfolio data, but we still reject
 * requests whose Host or Origin is clearly foreign so browsers can never be
 * coerced into POSTing to us from an attacker-controlled page.
 *
 * Allowed surfaces:
 * - Production: ar27111994.dev / www.ar27111994.dev (HTTP and HTTPS; the
 *   Vercel edge terminates TLS, so the Host header carries the bare name).
 * - Vercel previews: any *.vercel.app deployment (incl. branch aliases and
 *   per-commit URLs) so PR deployments can run the full live handshake.
 * - Local dev: localhost / 127.0.0.1 on any port.
 *
 * Tradeoff (documented): allowing *.vercel.app widens the trusted surface to
 * every Vercel project. Acceptable here because the MCP surface exposes only
 * read-only public data and the Host/origin check still blocks arbitrary
 * external origins (e.g. a random website's browser origin).
 */

const PRODUCTION_HOSTS = ["ar27111994.dev", "www.ar27111994.dev"];
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const PRODUCTION_ORIGINS = [
  "https://ar27111994.dev",
  "https://www.ar27111994.dev",
];
const LOCAL_ORIGINS = ["http://localhost:4321", "http://127.0.0.1:4321"];

/** Vercel preview deployments and branch aliases all live under vercel.app. */
function isVercelPreviewHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

function isVercelPreviewOrigin(origin: string): boolean {
  return origin.startsWith("https://") && origin.endsWith(".vercel.app");
}

function hostnameOf(host: string): string {
  // Strip any explicit port before matching (dev servers run on :4321).
  const withoutPort = host.replace(/:\d+$/, "");
  return withoutPort.startsWith("[") ? withoutPort.slice(1, -1) : withoutPort;
}

export function isAllowedMcpHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = hostnameOf(host);
  return (
    PRODUCTION_HOSTS.includes(hostname) ||
    LOCAL_HOSTS.includes(hostname) ||
    isVercelPreviewHost(hostname)
  );
}

export function isAllowedMcpOrigin(origin: string | null): boolean {
  // Non-browser MCP clients (CLI, desktop agents) send no Origin.
  if (!origin) return true;
  // Sandboxed contexts (e.g. some webviews) send the literal "null".
  if (origin === "null") return true;
  return (
    PRODUCTION_ORIGINS.includes(origin) ||
    LOCAL_ORIGINS.includes(origin) ||
    isVercelPreviewOrigin(origin)
  );
}
