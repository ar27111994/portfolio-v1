/**
 * API Route — /api/linkedin-feed
 * Fetches recent LinkedIn posts for ar27111994 via LinkedIn REST API.
 * Uses Client Credentials OAuth 2.0 flow (client_id + client_secret).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const LINKEDIN_API = "https://api.linkedin.com/v2";
const LINKEDIN_AUTH = "https://www.linkedin.com/oauth/v2";
const PERSON_URN = "urn:li:person:ar27111994";

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 300_000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not configured",
    );
  }

  const res = await fetch(`${LINKEDIN_AUTH}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "w_member_social openid profile email",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `LinkedIn auth failed ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return data.access_token;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const token = await getAccessToken();

    // Fetch posts — use the /posts endpoint with author filter
    const postsRes = await fetch(
      `${LINKEDIN_API}/posts?author=${encodeURIComponent(PERSON_URN)}&q=author&count=5&sortBy=LAST_MODIFIED`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    if (!postsRes.ok) {
      const text = await postsRes.text();
      res.status(postsRes.status).json({
        error: `LinkedIn posts fetch failed: ${postsRes.status}`,
        detail: text.slice(0, 300),
      });
      return;
    }

    const data = (await postsRes.json()) as {
      elements?: Array<{
        commentary?: string;
        createdAt?: number;
        id?: string;
      }>;
    };

    const posts = (data.elements || []).map((p) => ({
      title:
        (p.commentary || "LinkedIn post").slice(0, 100) +
        ((p.commentary || "").length > 100 ? "…" : ""),
      url: p.id
        ? `https://www.linkedin.com/feed/update/${p.id}`
        : "https://linkedin.com/in/ar27111994",
      date: p.createdAt
        ? new Date(p.createdAt).toISOString()
        : new Date().toISOString(),
      tag: "LinkedIn",
    }));

    res.status(200).json({ status: "success", posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
