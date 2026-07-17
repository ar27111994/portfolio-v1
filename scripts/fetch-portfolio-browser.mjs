#!/usr/bin/env node
/**
 * Browser-automated Upwork portfolio fetch using Playwright.
 *
 * Opens a non-headless Chromium window so you can log into Upwork
 * if needed, then executes the talentPortfolioProjects GraphQL query
 * with pageSize=999999 directly from the authenticated browser context.
 *
 * Usage:
 *   node scripts/fetch-portfolio-browser.mjs
 *
 * The script reuses your existing Chrome profile so you stay logged in.
 * Output is written to src/data/upwork-portfolio.json (same format as
 * the GraphQL/OAuth fetch script).
 */

import { chromium } from "playwright";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_FILE = join(ROOT, "src", "data", "upwork-portfolio.json");
const ENV_FILE = join(ROOT, ".env.local");

const PERSON_ID = "424245383220543488";
const PROFILE_URL = "https://www.upwork.com/freelancers/~0188baee67e8f543e7";
const GRAPHQL_URL = "https://api.upwork.com/graphql";

const PORTFOLIO_QUERY = `
  query GetPortfolioProjects($personId: ID!, $pageSize: Int!) {
    talentPortfolioProjects(
      filter: {
        personId: $personId,
        published: true,
        page: 0,
        pageSize: $pageSize
      }
    ) {
      projects {
        id
        title
        description
        projectUrl
        rank
        videoUrl
        completionDateTime
        createdDateTime
        thumbnail
        thumbnailOriginal
        attachments {
          id
          type
          title
          description
          link
          originalAttachment
          embeddedLinkUrl
          videoUrl
          fileName
          fileSize
          imageSmall
          imageMiddle
          imageLarge
          creationDateTime
          rank
        }
      }
      totalProjects
    }
  }
`;

// ── Transform (same logic as fetch-portfolio-build.mjs) ───────────

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractYouTubeId(url) {
  const m = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1];
}

function transformProjects(rawProjects) {
  return rawProjects.map((p) => {
    const id = slugify(String(p.title ?? ""));
    const attachments = [];

    if (p.videoUrl) {
      const ytId = extractYouTubeId(String(p.videoUrl));
      if (ytId) {
        attachments.push({
          type: "video", provider: "youtube", videoId: ytId,
          url: String(p.videoUrl),
          embeddedUrl: `https://www.youtube.com/embed/${ytId}`,
        });
      }
    }

    for (const att of p.attachments ?? []) {
      const attType = String(att.type ?? "");

      if (attType === "embeddedLink") {
        const linkUrl = att.link || att.originalAttachment || att.embeddedLinkUrl;
        if (linkUrl) {
          attachments.push({ type: "embeddedLink", url: String(linkUrl), originalAttachment: String(linkUrl) });
        }
      } else if (attType === "video" && att.videoUrl) {
        const ytId = extractYouTubeId(String(att.videoUrl));
        if (ytId) {
          attachments.push({
            type: "video", provider: "youtube", videoId: ytId,
            url: String(att.videoUrl),
            embeddedUrl: `https://www.youtube.com/embed/${ytId}`,
          });
        } else {
          attachments.push({ type: "video", provider: "direct", url: String(att.videoUrl) });
        }
      } else if (attType === "image" || att.originalAttachment) {
        attachments.push({
          type: attType || "file",
          url: String(att.originalAttachment || att.imageLarge || att.imageMiddle || att.imageSmall || ""),
          imageSmall: att.imageSmall,
          imageMiddle: att.imageMiddle,
          imageLarge: att.imageLarge,
        });
      }
    }

    if (p.thumbnail && !attachments.some((a) => a.type === "image")) {
      attachments.push({ type: "image", url: `https://www.upwork.com${p.thumbnail}`, thumbnail: `https://www.upwork.com${p.thumbnail}` });
    }

    const item = {
      id, title: String(p.title ?? ""), description: String(p.description ?? ""), skills: [],
    };
    if (attachments.length) item.attachments = attachments;
    if (p.projectUrl) item.url = String(p.projectUrl);
    if (p.completionDateTime) item.completionDate = String(p.completionDateTime);
    else if (p.createdDateTime) item.completionDate = String(p.createdDateTime).slice(0, 10);

    return item;
  });
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("[fetch-portfolio-browser] Launching Chromium…");

  const browser = await chromium.launchPersistentContext(
    join(process.env.LOCALAPPDATA || join(process.env.USERPROFILE, "AppData", "Local"),
      "Google", "Chrome", "User Data"),
    {
      headless: false,
      channel: "chrome",
      args: ["--profile-directory=Default"],
    },
  );

  const page = await browser.newPage();
  console.log("[fetch-portfolio-browser] Navigating to Upwork profile…");
  await page.goto(PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Check if logged in
  const loggedIn = await page.evaluate(() => !!document.querySelector('[data-logged-in], .navbar'));

  if (!loggedIn) {
    console.log("[fetch-portfolio-browser] ⚠️  Not logged in — please log into Upwork in the opened browser window.");
    console.log("[fetch-portfolio-browser] Press Enter in this terminal once logged in…");
    await new Promise((resolve) => process.stdin.once("data", resolve));
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  console.log("[fetch-portfolio-browser] Executing GraphQL query…");

  const result = await page.evaluate(
    async ({ url, query, variables }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      return res.json();
    },
    { url: GRAPHQL_URL, query: PORTFOLIO_QUERY, variables: { personId: PERSON_ID, pageSize: 999999 } },
  );

  await browser.close();

  if (result.errors?.length) {
    console.error("[fetch-portfolio-browser] GraphQL errors:", JSON.stringify(result.errors).slice(0, 500));
    process.exit(1);
  }

  const projectData = result.data?.talentPortfolioProjects;
  if (!projectData) {
    console.error("[fetch-portfolio-browser] Unexpected response shape — missing talentPortfolioProjects");
    process.exit(1);
  }

  const rawProjects = projectData.projects ?? [];
  console.log(`[fetch-portfolio-browser] Fetched ${rawProjects.length} projects (total: ${projectData.totalProjects})`);

  const items = transformProjects(rawProjects);

  // Merge with existing to preserve localImage paths
  let existingItems = [];
  if (existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
      existingItems = existing.items ?? [];
    } catch {}
  }

  const existingById = new Map(existingItems.map((i) => [i.id, i]));
  for (const fresh of items) {
    const prev = existingById.get(fresh.id);
    if (prev) {
      if (!fresh.completionDate && prev.completionDate) fresh.completionDate = prev.completionDate;
      if (!fresh.url && prev.url) fresh.url = prev.url;
      if (fresh.attachments?.length && prev.attachments?.length) {
        fresh.attachments = fresh.attachments.map((att, idx) => {
          const prevAtt = prev.attachments[idx];
          if (!prevAtt) return att;
          const preserved = {};
          if (!att.localImage && prevAtt.localImage) preserved.localImage = prevAtt.localImage;
          if (!att.videoId && prevAtt.videoId) preserved.videoId = prevAtt.videoId;
          return Object.keys(preserved).length ? { ...att, ...preserved } : att;
        });
      }
    }
  }

  // Keep existing items not in the fresh set
  const freshIds = new Set(items.map((i) => i.id));
  for (const [id, item] of existingById) {
    if (!freshIds.has(id)) items.push(item);
  }

  const output = {
    profileUrl: PROFILE_URL,
    lastUpdated: new Date().toISOString().split("T")[0],
    source: "upwork-browser-graphql-api",
    sourceNote: `Fetched via Playwright-automated talentPortfolioProjects query with pageSize=999999.`,
    extractedAt: new Date().toISOString(),
    items,
    total: items.length,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`[fetch-portfolio-browser] ✓ Wrote ${items.length} portfolio items to ${OUTPUT_FILE}`);

  // Write static count
  let envContent = "";
  if (existsSync(ENV_FILE)) envContent = readFileSync(ENV_FILE, "utf-8");
  const newLine = `UPWORK_STATIC_COUNT=${items.length}`;
  if (envContent.includes("UPWORK_STATIC_COUNT=")) {
    envContent = envContent.replace(/UPWORK_STATIC_COUNT=\d+/, newLine);
  } else {
    envContent = envContent.trim() + "\n" + newLine + "\n";
  }
  writeFileSync(ENV_FILE, envContent);
  console.log(`[fetch-portfolio-browser] ✓ Wrote ${newLine} to .env.local`);

  console.log("[fetch-portfolio-browser] Done!");
}

main().catch((err) => {
  console.error("[fetch-portfolio-browser] Fatal:", err.message);
  process.exit(1);
});
