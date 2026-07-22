/**
 * API Route — /api/coderlegion-feed
 * Proxies CoderLegion API calls server-side to keep the API key secure.
 * Returns recent posts for the ar27111994 user.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CL_API = "https://coderlegion.com/api/v1";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.CODERLEGION_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "CODERLEGION_API_KEY not configured" });
    return;
  }

  try {
    // Search for posts by the handle to get user-specific results
    const searchRes = await fetch(
      `${CL_API}/posts/search?q=ar27111994&page=1`,
      { headers: { "X-API-Key": apiKey } },
    );

    if (!searchRes.ok) {
      res.status(searchRes.status).json({
        error: `CoderLegion API returned ${searchRes.status}`,
      });
      return;
    }

    const data = (await searchRes.json()) as {
      status: string;
      data?: Array<{
        id: number;
        title: string;
        description: string;
        tags: string[];
        created_at: string;
        views: number;
        reactions: { total: number };
        author: { handle: string };
      }>;
    };

    const posts = (data.data || [])
      .filter((p) => p.author?.handle === "ar27111994")
      .slice(0, 4)
      .map((p) => ({
        title: p.title,
        url: `https://coderlegion.com/${p.id}/post`,
        date: p.created_at,
        tag: p.tags?.[0] || "Post",
        views: p.views,
        reactions: p.reactions?.total || 0,
      }));

    res.status(200).json({ status: "success", posts });
  } catch {
    res.status(500).json({ error: "Failed to fetch from CoderLegion" });
  }
}
