#!/usr/bin/env node
/**
 * Build-time Upwork portfolio fetch script.
 *
 * Run during `npm run build` (via `prebuild` hook) to refresh
 * src/data/upwork-portfolio.json from the live Upwork GraphQL API.
 *
 * Token refresh is automatic — if the access token is stale (< 10 min
 * remaining), we fetch a fresh one via the refresh_token grant and write
 * the updated credentials back to .upwork-token.json (local dev) or
 * print them for manual Vercel env-var update (CI / Vercel build).
 *
 * Environment variable resolution order:
 *  1. Shell env vars (UPWORK_ACCESS_TOKEN, UPWORK_REFRESH_TOKEN, etc.)
 *     → used in Vercel build environment / CI
 *  2. .upwork-token.json at project root
 *     → used in local development
 *
 * Required env vars (set in Vercel or shell, OR sourced from token file):
 *   UPWORK_API_KEY       — OAuth2 client ID
 *   UPWORK_API_SECRET    — OAuth2 client secret
 *   UPWORK_ACCESS_TOKEN  — current access token
 *   UPWORK_REFRESH_TOKEN — long-lived refresh token
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TOKEN_FILE = join(ROOT, ".upwork-token.json");
const OUTPUT_FILE = join(ROOT, "src", "data", "upwork-portfolio.json");

const UPWORK_TOKEN_URL = "https://www.upwork.com/api/v3/oauth2/token";
const UPWORK_GRAPHQL_URL = "https://api.upwork.com/graphql";
const PERSON_ID = "424245383220543488";
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ⚠️  KNOWN LIMITATION — Upwork API-598
//
// The official developer GraphQL API (`api.upwork.com/graphql`) exposes:
//   talentProfile → profiles[] → projectList → projects[]
// which returns at most 20 items with no pagination (API-598 is open for this).
//
// The browser internal API (`www.upwork.com/api/graphql/v1`) exposes:
//   talentPortfolioProjects(filter: { page, pageSize, ... }) → { projects[], totalProjects, totalPages }
// which supports full pagination (pageSize up to 40+) but requires browser session
// cookies (Cloudflare-protected) and a different OAuth scope not available to
// developer app tokens.
//
// CURRENT APPROACH: `upwork-portfolio.json` is pre-populated with all 40 projects
// via a one-time manual fetch using the browser session token (June 2026).
// This script continues to refresh the 20-item official-API slice on each build,
// which keeps the most-recently-added projects current. When Upwork resolves API-598
// or exposes talentPortfolioProjects to developer tokens, update PORTFOLIO_QUERY
// and UPWORK_GRAPHQL_URL accordingly.
//
// To manually refresh all 40 items: capture a browser session curl from
// https://www.upwork.com/freelancers/~0188baee67e8f543e7 (Network → getPortfolioProjects),
// change pageSize to 40, run the curl, then pipe the output through
// scripts/transform-portfolio.mjs (or re-run the manual transform step).

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadTokens() {
  // 1. Shell / process env (Vercel build, CI)
  if (process.env.UPWORK_ACCESS_TOKEN && process.env.UPWORK_REFRESH_TOKEN) {
    const obtainedAt = Number(process.env.UPWORK_TOKEN_OBTAINED_AT ?? "0");
    const expiresIn = Number(process.env.UPWORK_TOKEN_EXPIRES_IN ?? "86400");
    return {
      access_token: process.env.UPWORK_ACCESS_TOKEN,
      refresh_token: process.env.UPWORK_REFRESH_TOKEN,
      token_type: "Bearer",
      expires_in: expiresIn,
      obtained_at: obtainedAt ? new Date(obtainedAt).toISOString() : null,
      source: "env",
    };
  }

  // 2. Local token file
  if (existsSync(TOKEN_FILE)) {
    try {
      const raw = readFileSync(TOKEN_FILE, "utf-8");
      return { ...JSON.parse(raw), source: "file" };
    } catch {
      console.error(
        "[fetch-portfolio-build] Failed to parse .upwork-token.json",
      );
    }
  }

  throw new Error(
    "No Upwork tokens found.\n" +
      "  • Local dev: run `node scripts/get-upwork-token.mjs` to authenticate.\n" +
      "  • CI/Vercel: set UPWORK_ACCESS_TOKEN + UPWORK_REFRESH_TOKEN env vars.",
  );
}

function isStale(tokens) {
  const obtainedAt = tokens.obtained_at
    ? new Date(tokens.obtained_at).getTime()
    : 0;
  const expiresIn = tokens.expires_in ?? 86400;
  const expiresAt = obtainedAt + expiresIn * 1000;
  return Date.now() + STALE_THRESHOLD_MS >= expiresAt;
}

async function refreshTokens(tokens) {
  const clientId = process.env.UPWORK_API_KEY;
  const clientSecret = process.env.UPWORK_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "UPWORK_API_KEY and UPWORK_API_SECRET must be set to refresh the token.",
    );
  }

  console.log("[fetch-portfolio-build] Access token stale — refreshing…");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
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
    throw new Error(
      `Token refresh failed ${res.status}: ${text.slice(0, 300)}`,
    );
  }

  const json = await res.json();
  const now = new Date().toISOString();

  const fresh = {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? tokens.refresh_token,
    token_type: json.token_type ?? "Bearer",
    expires_in: json.expires_in ?? 86400,
    obtained_at: now,
  };

  // Persist locally if we loaded from a file
  if (tokens.source === "file") {
    writeFileSync(TOKEN_FILE, JSON.stringify(fresh, null, 2));
    console.log(
      "[fetch-portfolio-build] Refreshed tokens written to .upwork-token.json",
    );
  } else {
    // In a Vercel build we can't persist back — log the new values so they
    // can be updated manually or via Vercel API
    console.log(
      "[fetch-portfolio-build] Token refreshed. Update Vercel env vars:\n" +
        `  UPWORK_ACCESS_TOKEN  = ${fresh.access_token.slice(0, 20)}…\n` +
        `  UPWORK_REFRESH_TOKEN = ${fresh.refresh_token.slice(0, 20)}…\n` +
        `  UPWORK_TOKEN_OBTAINED_AT = ${Date.now()}\n` +
        `  UPWORK_TOKEN_EXPIRES_IN  = ${fresh.expires_in}`,
    );
  }

  return fresh;
}

// ─────────────────────────────────────────────────────────────────────────────
// GraphQL query — identical to the one in api/upwork-portfolio.ts
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

// ─────────────────────────────────────────────────────────────────────────────
// Transform — same logic as api/upwork-portfolio.ts
// ─────────────────────────────────────────────────────────────────────────────

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractYouTubeId(url) {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1];
}

function transformProjects(rawProjects) {
  return rawProjects.map((p) => {
    const id = slugify(String(p.title ?? ""));
    const skills = (p.tags ?? [])
      .map((t) => t.skill?.prettyName)
      .filter(Boolean);

    const attachments = [];

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
    for (const att of p.attachments ?? []) {
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
          title: att.title ?? null,
          description: att.description ?? null,
          fileName: att.attachmentName,
          fileSize: att.attachmentSize,
          imageSmall: att.imageSmall,
          imageMiddle: att.imageMiddle,
          imageLarge: att.imageLarge,
        });
      }
    }

    // Fallback thumbnail
    if (p.thumbnail && !attachments.some((a) => a.type === "image")) {
      const thumbUrl = `https://www.upwork.com${p.thumbnail}`;
      attachments.push({ type: "image", url: thumbUrl, thumbnail: thumbUrl });
    }

    const item = {
      id,
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      skills,
    };
    if (attachments.length) item.attachments = attachments;
    if (p.completionDateTime)
      item.completionDate = String(p.completionDateTime);
    if (p.projectUrl) item.url = String(p.projectUrl);

    return item;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch portfolio
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPortfolio(accessToken) {
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
    throw new Error(`Upwork GraphQL ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = await res.json();

  if (data.errors?.length) {
    throw new Error(
      `GraphQL errors: ${JSON.stringify(data.errors).slice(0, 400)}`,
    );
  }

  const projectList = data.data?.talentProfile?.profiles?.[0]?.projectList;
  if (!projectList) {
    throw new Error("Unexpected Upwork API response: missing projectList");
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
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[fetch-portfolio-build] Starting Upwork portfolio fetch…");

  let tokens = loadTokens();

  if (isStale(tokens)) {
    tokens = await refreshTokens(tokens);
  } else {
    console.log("[fetch-portfolio-build] Token valid — skipping refresh.");
  }

  console.log(
    "[fetch-portfolio-build] Fetching portfolio from Upwork GraphQL…",
  );
  const portfolio = await fetchPortfolio(tokens.access_token);

  // ── Merge with existing data ──────────────────────────────────────────────
  // The official API caps at 20 items (Upwork API-598). The JSON on disk may
  // contain up to 40 items fetched via the browser session tool. We merge:
  //   • Keep ALL existing items as the base.
  //   • Upsert items returned by the API (update title/description/skills/atts).
  //   • This preserves projects not yet returned by the API rather than losing them.
  let mergedItems = portfolio.items;
  if (existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
      const existingById = new Map(
        (existing.items ?? []).map((i) => [i.id, i]),
      );
      // Apply fresh API data on top of existing, preserving locally-downloaded
      // attachment fields (localImage, videoId) and manually-set metadata
      // (completionDate) that the official API never returns for these items.
      for (const fresh of portfolio.items) {
        const prev = existingById.get(fresh.id);
        if (prev) {
          // Preserve completionDate if the API omitted it but we had one set
          if (!fresh.completionDate && prev.completionDate) {
            fresh.completionDate = prev.completionDate;
          }
        }
        if (prev?.attachments?.length && fresh.attachments?.length) {
          // Re-attach any localImage / videoId from the matching previous attachment
          // (match by position — the API always returns attachments in the same order)
          fresh.attachments = fresh.attachments.map((att, idx) => {
            const prevAtt = prev.attachments[idx];
            if (!prevAtt) return att;
            const preserved = {};
            if (!att.localImage && prevAtt.localImage)
              preserved.localImage = prevAtt.localImage;
            if (!att.videoId && prevAtt.videoId)
              preserved.videoId = prevAtt.videoId;
            return Object.keys(preserved).length
              ? { ...att, ...preserved }
              : att;
          });
        }
        existingById.set(fresh.id, fresh);
      }
      // Sort by rank (fresh items have rank; older items may not — put them last)
      mergedItems = [...existingById.values()].sort(
        (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
      );
      console.log(
        `[fetch-portfolio-build] Merged: ${portfolio.items.length} from API + kept ${mergedItems.length - portfolio.items.length} existing = ${mergedItems.length} total`,
      );
    } catch {
      console.log(
        "[fetch-portfolio-build] Could not read existing JSON — using API data only.",
      );
    }
  }

  const output = {
    ...portfolio,
    items: mergedItems,
    total: mergedItems.length,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(
    `[fetch-portfolio-build] ✓ Wrote ${mergedItems.length} portfolio items to src/data/upwork-portfolio.json`,
  );

  // Write UPWORK_STATIC_COUNT to .env.local so the API serverless function
  // can read the true full-JSON count via process.env.UPWORK_STATIC_COUNT.
  // This file is .gitignored — Vercel reads it automatically during builds.
  const envLocalPath = join(ROOT, ".env.local");
  const envLine = `UPWORK_STATIC_COUNT=${mergedItems.length}\n`;
  try {
    let envContent = "";
    if (existsSync(envLocalPath)) {
      envContent = readFileSync(envLocalPath, "utf-8");
      // Replace existing line if present
      envContent = envContent.replace(/^UPWORK_STATIC_COUNT=.*\n?/m, "");
    }
    writeFileSync(envLocalPath, envContent + envLine);
    console.log(
      `[fetch-portfolio-build] ✓ Wrote UPWORK_STATIC_COUNT=${mergedItems.length} to .env.local`,
    );
  } catch (e) {
    console.warn(
      `[fetch-portfolio-build] Could not write .env.local: ${e.message}`,
    );
  }

  // ── Fetch GitHub stats at build time so static fallbacks stay accurate ────
  // Writes GITHUB_PUBLIC_REPOS and GITHUB_TOTAL_STARS to .env.local.
  // The Astro page reads them via import.meta.env at build time.
  try {
    const ghProfileRes = await fetch(
      "https://api.github.com/users/ar27111994",
      {
        headers: { "User-Agent": "portfolio-v1-build" },
      },
    );
    const ghReposRes = await fetch(
      "https://api.github.com/users/ar27111994/repos?per_page=100",
      { headers: { "User-Agent": "portfolio-v1-build" } },
    );
    if (ghProfileRes.ok && ghReposRes.ok) {
      const ghProfile = await ghProfileRes.json();
      const ghRepos = await ghReposRes.json();
      const publicRepos =
        Number(ghProfile.public_repos) ||
        (Array.isArray(ghRepos) ? ghRepos.length : 0);
      const totalStars = Array.isArray(ghRepos)
        ? ghRepos.reduce((s, r) => s + (Number(r.stargazers_count) || 0), 0)
        : 0;

      let env2 = existsSync(envLocalPath)
        ? readFileSync(envLocalPath, "utf-8")
        : "";
      env2 = env2.replace(/^GITHUB_PUBLIC_REPOS=.*\n?/m, "");
      env2 = env2.replace(/^GITHUB_TOTAL_STARS=.*\n?/m, "");
      writeFileSync(
        envLocalPath,
        env2 +
          `GITHUB_PUBLIC_REPOS=${publicRepos}\nGITHUB_TOTAL_STARS=${totalStars}\n`,
      );
      console.log(
        `[fetch-portfolio-build] ✓ GitHub stats: ${publicRepos} public repos, ${totalStars} total stars`,
      );
    } else {
      console.warn(
        "[fetch-portfolio-build] GitHub API unavailable — keeping existing fallbacks.",
      );
    }
  } catch (e) {
    console.warn(
      `[fetch-portfolio-build] GitHub stats fetch failed: ${e.message}`,
    );
  }
}

main().catch((err) => {
  console.error("[fetch-portfolio-build] Fatal:", err.message);
  console.error(
    "[fetch-portfolio-build] ⚠️  Continuing build with existing upwork-portfolio.json.",
    "The deployed site will show the last-fetched portfolio data.",
  );
  // Exit 0 so the build is not blocked — stale data is better than a broken deploy.
  process.exit(0);
});
