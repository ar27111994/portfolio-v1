/**
 * API Route — /api/feed
 * Unified multi-source feed with server-side pagination.
 * Fetches from 7 sources, merges by date (newest first), paginates.
 *
 * Query params: page (default 1), per_page (default 10, max 30)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface FeedItem {
  title: string;
  url: string;
  source: string;
  date: string;
  icon: string;
  tag: string;
}

const PER_PAGE_MAX = 30;
const PER_PAGE_DEFAULT = 10;

// ── Source fetchers ─────────────────────────────────────────────────

async function fetchDevTo(): Promise<FeedItem[]> {
  const res = await fetch(
    "https://dev.to/api/articles?username=ar27111994&per_page=20",
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    title: string;
    url: string;
    published_at: string;
    tag_list: string[];
  }>;
  return data.map((a) => ({
    title: a.title,
    url: a.url,
    source: "Dev.to",
    date: a.published_at,
    icon: "/brand-icons/devdotto.svg",
    tag: a.tag_list?.[0] || "Article",
  }));
}

async function fetchGitHubRepos(): Promise<FeedItem[]> {
  const res = await fetch(
    "https://api.github.com/users/ar27111994/repos?sort=updated&per_page=15",
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    name: string;
    html_url: string;
    updated_at: string;
    language: string | null;
  }>;
  return data.map((r) => ({
    title: r.name,
    url: r.html_url,
    source: "GitHub",
    date: r.updated_at,
    icon: "/brand-icons/github.svg",
    tag: r.language || "Repo",
  }));
}

async function fetchGitHubGists(): Promise<FeedItem[]> {
  const res = await fetch(
    "https://api.github.com/users/ar27111994/gists?per_page=10",
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    html_url: string;
    updated_at: string;
    files: Record<string, unknown>;
  }>;
  return data.map((g) => ({
    title: Object.keys(g.files || {})[0] || "Gist",
    url: g.html_url,
    source: "GitHub",
    date: g.updated_at,
    icon: "/brand-icons/github.svg",
    tag: "Gist",
  }));
}

async function fetchHN(): Promise<FeedItem[]> {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search?tags=author_ar27111994&hitsPerPage=10",
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    hits?: Array<{
      title?: string;
      story_title?: string;
      url?: string;
      objectID: string;
      created_at: string;
    }>;
  };
  return (data.hits || []).map((h) => ({
    title: h.title || h.story_title || "HN post",
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: "Hacker News",
    date: h.created_at,
    icon: "/brand-icons/ycombinator.svg",
    tag: "HN",
  }));
}

async function fetchHashnode(): Promise<FeedItem[]> {
  try {
    const res = await fetch("https://gql.hashnode.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ user(username: "ar27111994") { publication { posts(first: 10) { edges { node { title slug dateAdded } } } } } }`,
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: {
        user?: {
          publication?: {
            posts?: {
              edges?: Array<{
                node: { title: string; slug: string; dateAdded: string };
              }>;
            };
          };
        };
      };
    };
    return (data?.data?.user?.publication?.posts?.edges || []).map(
      ({ node }) => ({
        title: node.title,
        url: `https://hashnode.com/post/${node.slug}`,
        source: "Hashnode",
        date: node.dateAdded,
        icon: "/brand-icons/hashnode.svg",
        tag: "Blog",
      }),
    );
  } catch {
    return [];
  }
}

async function fetchCoderLegion(): Promise<FeedItem[]> {
  const key = process.env.CODERLEGION_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      "https://coderlegion.com/api/v1/posts/search?q=ar27111994&page=1",
      { headers: { "X-API-Key": key } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: Array<{
        id: number;
        title: string;
        created_at: string;
        tags: string[];
        author: { handle: string };
      }>;
    };
    return (data.data || [])
      .filter((p) => p.author?.handle === "ar27111994")
      .slice(0, 10)
      .map((p) => ({
        title: p.title,
        url: `https://coderlegion.com/${p.id}/post`,
        source: "CoderLegion",
        date: p.created_at,
        icon: "/brand-icons/coderlegion.svg",
        tag: p.tags?.[0] || "Post",
      }));
  } catch {
    return [];
  }
}

async function fetchTwitter(): Promise<FeedItem[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];
  try {
    const userRes = await fetch(
      "https://api.twitter.com/2/users/by/username/ar27111994",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!userRes.ok) return [];
    const userData = (await userRes.json()) as { data?: { id: string } };
    const userId = userData.data?.id;
    if (!userId) return [];
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at&exclude=retweets,replies`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!tweetsRes.ok) return [];
    const tweetsData = (await tweetsRes.json()) as {
      data?: Array<{ id: string; text: string; created_at: string }>;
    };
    return (tweetsData.data || []).map((t) => ({
      title: t.text.slice(0, 100) + (t.text.length > 100 ? "…" : ""),
      url: `https://x.com/ar27111994/status/${t.id}`,
      source: "X/Twitter",
      date: t.created_at,
      icon: "/brand-icons/x.svg",
      tag: "Tweet",
    }));
  } catch {
    return [];
  }
}

async function fetchLinkedIn(): Promise<FeedItem[]> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];
  try {
    if (!token) {
      const authRes = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            scope: "w_member_social openid profile",
          }),
        },
      );
      if (!authRes.ok) return [];
      const auth = (await authRes.json()) as { access_token: string };
      token = auth.access_token;
    }
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/posts?author=urn:li:person:ar27111994&q=author&count=10&sortBy=LAST_MODIFIED`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );
    if (!postsRes.ok) return [];
    const data = (await postsRes.json()) as {
      elements?: Array<{
        commentary?: string;
        createdAt?: number;
        id?: string;
      }>;
    };
    return (data.elements || []).map((p) => ({
      title:
        (p.commentary || "LinkedIn post").slice(0, 100) +
        ((p.commentary || "").length > 100 ? "…" : ""),
      url: p.id
        ? `https://www.linkedin.com/feed/update/${p.id}`
        : "https://linkedin.com/in/ar27111994",
      source: "LinkedIn",
      date: p.createdAt ? new Date(p.createdAt).toISOString() : "",
      icon: "/brand-icons/linkedin.svg",
      tag: "LinkedIn",
    }));
  } catch {
    return [];
  }
}

// ── Handler ──────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const perPage = Math.min(
    PER_PAGE_MAX,
    Math.max(
      1,
      parseInt(String(req.query.per_page || String(PER_PAGE_DEFAULT)), 10) ||
        PER_PAGE_DEFAULT,
    ),
  );

  try {
    const results = await Promise.allSettled([
      fetchDevTo(),
      fetchGitHubRepos(),
      fetchGitHubGists(),
      fetchHN(),
      fetchHashnode(),
      fetchCoderLegion(),
      fetchTwitter(),
      fetchLinkedIn(),
    ]);

    // Merge all successful results
    let all: FeedItem[] = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") all = all.concat(r.value);
    });

    // Sort by date, newest first
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const total = all.length;
    const start = (page - 1) * perPage;
    const items = all.slice(start, start + perPage);
    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      status: "success",
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
      has_more: page < totalPages,
      items,
    });
  } catch {
    res.status(500).json({ error: "Failed to aggregate feed" });
  }
}
