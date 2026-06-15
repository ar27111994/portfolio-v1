/**
 * Vercel Serverless API Route — /api/upwork-portfolio
 *
 * Responsibilities:
 *  1. Read tokens from env vars
 *  2. If access token is stale, use refresh_token to get a new one
 *     and persist it back via the Vercel API (no filesystem in serverless)
 *  3. Fetch portfolio data via official Upwork GraphQL API
 *  4. Return transformed JSON — same shape as src/data/upwork-portfolio.json
 *
 * Triggered by:
 *  - Vercel Cron (daily at 05:00 UTC) — POST /api/upwork-portfolio
 *  - Client-side fetch (GET /api/upwork-portfolio) — live portfolio load
 *
 * Environment variables required (set in Vercel dashboard):
 *  UPWORK_API_KEY          — OAuth2 client ID
 *  UPWORK_API_SECRET       — OAuth2 client secret
 *  UPWORK_ACCESS_TOKEN     — current access token (refreshed automatically)
 *  UPWORK_REFRESH_TOKEN    — long-lived refresh token
 *  VERCEL_API_TOKEN        — Vercel API token for updating env vars in-place
 *  VERCEL_PROJECT_ID       — prj_... ID for the portfolio project
 *  VERCEL_TEAM_ID          — team_... ID (or "personal" for personal accounts)
 *  CRON_SECRET             — random secret to guard cron POST endpoint
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const UPWORK_TOKEN_URL = "https://www.upwork.com/api/v3/oauth2/token";
const UPWORK_GRAPHQL_URL = "https://api.upwork.com/graphql";
const PERSON_ID = "424245383220543488";

/** Vercel env var names we'll update in-place when the token refreshes. */
const ENV_ACCESS_TOKEN_KEY = "UPWORK_ACCESS_TOKEN";
const ENV_REFRESH_TOKEN_KEY = "UPWORK_REFRESH_TOKEN";

/** Treat access token as stale when < 10 min remain (token TTL is 24 h). */
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

interface PortfolioAttachment {
  type: string;
  url?: string;
  thumbnail?: string;
  title?: string | null;
  description?: string | null;
  fileName?: string;
  fileSize?: number;
  imageSmall?: string;
  imageMiddle?: string;
  imageLarge?: string;
  provider?: string;
  videoId?: string;
  embeddedUrl?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  skills: string[];
  attachments?: PortfolioAttachment[];
  completionDate?: string;
  url?: string;
}

interface PortfolioOutput {
  profileUrl: string;
  lastUpdated: string;
  source: string;
  sourceNote: string;
  extractedAt: string;
  items: PortfolioItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh
// ─────────────────────────────────────────────────────────────────────────────

function readTokensFromEnv(): TokenBundle {
  const accessToken = process.env.UPWORK_ACCESS_TOKEN ?? "";
  const refreshToken = process.env.UPWORK_REFRESH_TOKEN ?? "";
  // We encode obtained_at as a separate env var so we can decide staleness;
  // if absent, assume stale so we always refresh on first cold-start.
  const obtainedAt = Number(process.env.UPWORK_TOKEN_OBTAINED_AT ?? "0");
  const expiresIn = Number(process.env.UPWORK_TOKEN_EXPIRES_IN ?? "86400");
  const expiresAt = obtainedAt + expiresIn * 1000;
  return { accessToken, refreshToken, expiresAt };
}

function isStale(bundle: TokenBundle): boolean {
  if (!bundle.accessToken) return true;
  return Date.now() + STALE_THRESHOLD_MS >= bundle.expiresAt;
}

async function refreshAccessToken(bundle: TokenBundle): Promise<TokenBundle> {
  const clientId = process.env.UPWORK_API_KEY ?? "";
  const clientSecret = process.env.UPWORK_API_SECRET ?? "";

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: bundle.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(UPWORK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const now = Date.now();
  const expiresIn = json.expires_in ?? 86400;

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? bundle.refreshToken,
    expiresAt: now + expiresIn * 1000,
  };
}

/**
 * Persist refreshed tokens back to Vercel env vars so the next invocation
 * picks them up without a new PKCE flow.
 */
async function persistTokensToVercel(bundle: TokenBundle): Promise<void> {
  const vercelToken = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID; // optional

  if (!vercelToken || !projectId) {
    console.warn(
      "[upwork-portfolio] VERCEL_API_TOKEN or VERCEL_PROJECT_ID not set; " +
        "refreshed tokens will not persist across invocations.",
    );
    return;
  }

  const teamQuery = teamId ? `?teamId=${teamId}` : "";
  const base = `https://api.vercel.com/v9/projects/${projectId}/env${teamQuery}`;
  const headers = {
    Authorization: `Bearer ${vercelToken}`,
    "Content-Type": "application/json",
  };

  const updates: Array<{ key: string; value: string }> = [
    { key: ENV_ACCESS_TOKEN_KEY, value: bundle.accessToken },
    { key: ENV_REFRESH_TOKEN_KEY, value: bundle.refreshToken },
    { key: "UPWORK_TOKEN_OBTAINED_AT", value: String(Date.now()) },
    {
      key: "UPWORK_TOKEN_EXPIRES_IN",
      value: String(
        Math.round((bundle.expiresAt - Date.now()) / 1000),
      ),
    },
  ];

  // Vercel env API: we need to upsert (delete + create or patch existing).
  // Simplest: list existing env var IDs then PATCH each by ID.
  const listRes = await fetch(base, { headers });
  if (!listRes.ok) {
    console.warn("[upwork-portfolio] Failed to list Vercel env vars:", listRes.status);
    return;
  }
  const listJson = (await listRes.json()) as {
    envs?: Array<{ id: string; key: string }>;
  };
  const existing = new Map(
    (listJson.envs ?? []).map((e) => [e.key, e.id]),
  );

  await Promise.all(
    updates.map(async ({ key, value }) => {
      const id = existing.get(key);
      if (id) {
        // PATCH existing
        await fetch(
          `https://api.vercel.com/v9/projects/${projectId}/env/${id}${teamQuery ? `?teamId=${teamId}` : ""}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ value, target: ["production"] }),
          },
        );
      } else {
        // POST new
        await fetch(base, {
          method: "POST",
          headers,
          body: JSON.stringify({
            key,
            value,
            type: "encrypted",
            target: ["production"],
          }),
        });
      }
    }),
  );

  console.log("[upwork-portfolio] Tokens persisted to Vercel env vars.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio fetch + transform (same logic as the old fetch-official-api.mjs)
// ─────────────────────────────────────────────────────────────────────────────

const PORTFOLIO_QUERY = `
  query GetTalentProfile($personId: ID!) {
    talentProfile(personId: $personId) {
      profiles {
        personId
        personalData {
          firstName
          lastName
        }
        projectList {
          projects {
            id
            title
            description
            projectUrl
            rank
            videoUrl
            completionDateTime
            thumbnail
            thumbnailOriginal
            attachments {
              id
              type
              title
              description
              videoUrl
              attachmentName
              attachmentSize
              originalAttachment
              imageSmall
              imageMiddle
              imageLarge
            }
            tags {
              id
              skill {
                prettyName
              }
            }
          }
          totalProjects
        }
      }
    }
  }
`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractYouTubeId(url: string): string | undefined {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1];
}

function transformProjects(rawProjects: unknown[]): PortfolioItem[] {
  return rawProjects.map((project) => {
    const p = project as Record<string, unknown>;

    const id = slugify(String(p.title ?? ""));
    const skills = ((p.tags as Array<Record<string, unknown>>) ?? [])
      .map((t) => (t.skill as Record<string, string>)?.prettyName)
      .filter(Boolean) as string[];

    const attachments: PortfolioAttachment[] = [];

    // Project-level video URL
    if (p.videoUrl) {
      const ytId = extractYouTubeId(String(p.videoUrl));
      if (ytId) {
        attachments.push({
          type: "video",
          provider: "youtube",
          videoId: ytId,
          url: String(p.videoUrl),
          embeddedUrl: `https://www.youtube.com/embed/${ytId}`,
        });
      }
    }

    // Attachment-level entries
    for (const att of (p.attachments as Array<Record<string, unknown>>) ?? []) {
      const attType = String(att.type ?? "");
      if (attType === "video" && att.videoUrl) {
        const ytId = extractYouTubeId(String(att.videoUrl));
        if (ytId) {
          attachments.push({
            type: "video",
            provider: "youtube",
            videoId: ytId,
            url: String(att.videoUrl),
            embeddedUrl: `https://www.youtube.com/embed/${ytId}`,
          });
        }
      } else if (att.originalAttachment) {
        attachments.push({
          type: attType || "file",
          url: String(att.originalAttachment),
          title: (att.title as string | null) ?? null,
          description: (att.description as string | null) ?? null,
          fileName: att.attachmentName as string | undefined,
          fileSize: att.attachmentSize as number | undefined,
          imageSmall: att.imageSmall as string | undefined,
          imageMiddle: att.imageMiddle as string | undefined,
          imageLarge: att.imageLarge as string | undefined,
        });
      }
    }

    // Fallback thumbnail
    if (p.thumbnail && !attachments.some((a) => a.type === "image")) {
      const thumbUrl = `https://www.upwork.com${p.thumbnail}`;
      attachments.push({ type: "image", url: thumbUrl, thumbnail: thumbUrl });
    }

    const item: PortfolioItem = {
      id,
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      skills,
    };

    if (attachments.length) item.attachments = attachments;
    if (p.completionDateTime) item.completionDate = String(p.completionDateTime);
    if (p.projectUrl) item.url = String(p.projectUrl);

    return item;
  });
}

async function fetchPortfolioData(accessToken: string): Promise<PortfolioOutput> {
  const res = await fetch(UPWORK_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: PORTFOLIO_QUERY,
      variables: { personId: PERSON_ID },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upwork GraphQL ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    data?: {
      talentProfile?: {
        profiles?: Array<{
          projectList?: { projects?: unknown[]; totalProjects?: number };
        }>;
      };
    };
    errors?: unknown[];
  };

  if (data.errors?.length) {
    throw new Error(
      `GraphQL errors: ${JSON.stringify(data.errors).slice(0, 300)}`,
    );
  }

  const projectList = data.data?.talentProfile?.profiles?.[0]?.projectList;
  if (!projectList) {
    throw new Error("Unexpected Upwork API response shape: missing projectList");
  }

  const items = transformProjects(projectList.projects ?? []);
  const now = new Date();

  return {
    profileUrl: "https://www.upwork.com/freelancers/~0188baee67e8f543e7",
    lastUpdated: now.toISOString().split("T")[0],
    source: "upwork-official-graphql-api",
    sourceNote: "Fetched via official Upwork talentProfile GraphQL query.",
    extractedAt: now.toISOString(),
    items,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Guard cron POST requests with CRON_SECRET
  if (req.method === "POST") {
    const secret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization ?? "";
    if (!secret || authHeader !== `Bearer ${secret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  // Allow GET and POST; reject everything else
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const isCron = req.method === "POST";

  try {
    let tokens = readTokensFromEnv();

    if (isStale(tokens)) {
      console.log("[upwork-portfolio] Token stale, refreshing…");
      tokens = await refreshAccessToken(tokens);
      // Persist without blocking the response
      persistTokensToVercel(tokens).catch((err) =>
        console.error("[upwork-portfolio] Failed to persist tokens:", err),
      );
    }

    const portfolio = await fetchPortfolioData(tokens.accessToken);

    // On cron runs, trigger a Vercel deploy so the static site rebuilds with fresh data.
    // VERCEL_DEPLOY_HOOK_URL is optional — set it in Vercel env vars once you create
    // a deploy hook at: Settings → Git → Deploy Hooks.
    if (isCron) {
      const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
      if (deployHookUrl) {
        fetch(deployHookUrl, { method: "POST" })
          .then(() => console.log("[upwork-portfolio] Deploy hook triggered."))
          .catch((err) =>
            console.error("[upwork-portfolio] Deploy hook failed:", err),
          );
      } else {
        console.log(
          "[upwork-portfolio] No VERCEL_DEPLOY_HOOK_URL set — skipping deploy trigger.",
        );
      }
    }

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .setHeader(
        "Cache-Control",
        isCron
          ? "no-store" // cron response is not cacheable
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      )
      .setHeader("Access-Control-Allow-Origin", "https://www.ar27111994.dev")
      .json(portfolio);
  } catch (err) {
    console.error("[upwork-portfolio] Error:", err);
    res.status(500).json({
      error: "Failed to fetch Upwork portfolio",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
