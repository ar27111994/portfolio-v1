/**
 * API Route — /api/twitter-feed
 * Fetches recent tweets for @ar27111994 via X/Twitter API v2.
 * Uses Bearer Token from env var — never exposed to client.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const TWITTER_API = "https://api.twitter.com/2";

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

  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    res.status(500).json({ error: "TWITTER_BEARER_TOKEN not configured" });
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    // Step 1: Get user ID by username
    const userRes = await fetch(`${TWITTER_API}/users/by/username/ar27111994`, {
      headers,
    });
    if (!userRes.ok) {
      res
        .status(userRes.status)
        .json({ error: `Twitter user lookup failed: ${userRes.status}` });
      return;
    }
    const userData = (await userRes.json()) as { data?: { id: string } };
    const userId = userData.data?.id;
    if (!userId) {
      res.status(404).json({ error: "Twitter user not found" });
      return;
    }

    // Step 2: Fetch recent tweets
    const tweetsRes = await fetch(
      `${TWITTER_API}/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics&exclude=retweets,replies`,
      { headers },
    );
    if (!tweetsRes.ok) {
      res
        .status(tweetsRes.status)
        .json({ error: `Twitter tweets fetch failed: ${tweetsRes.status}` });
      return;
    }
    const tweetsData = (await tweetsRes.json()) as {
      data?: Array<{
        id: string;
        text: string;
        created_at: string;
        public_metrics?: { like_count: number; retweet_count: number };
      }>;
    };

    const tweets = (tweetsData.data || []).map((t) => ({
      title: t.text.slice(0, 100) + (t.text.length > 100 ? "…" : ""),
      url: `https://x.com/ar27111994/status/${t.id}`,
      date: t.created_at,
      tag: "Tweet",
      likes: t.public_metrics?.like_count || 0,
    }));

    res.status(200).json({ status: "success", tweets });
  } catch {
    res.status(500).json({ error: "Failed to fetch from Twitter" });
  }
}
