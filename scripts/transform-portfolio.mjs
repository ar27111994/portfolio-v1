#!/usr/bin/env node
/**
 * transform-portfolio.mjs
 *
 * One-time / manual helper to convert raw talentPortfolioProjects API output
 * (from a browser session curl) into src/data/upwork-portfolio.json.
 *
 * USAGE:
 *   1. Open Chrome → https://www.upwork.com/freelancers/~0188baee67e8f543e7
 *   2. DevTools → Network → filter "getPortfolioProjects" → Copy as cURL
 *   3. Change `"pageSize":4` to `"pageSize":40` in --data-raw
 *   4. Add `"fillTagDetails":true` to the variables object
 *   5. Run the curl and save output:
 *        bash portfolio-session.sh > raw.json
 *   6. Run this script:
 *        node scripts/transform-portfolio.mjs raw.json
 *
 * This is needed because the official developer API (api.upwork.com/graphql)
 * caps talentProfile.projectList at 20 items (Upwork API-598, no ETA for fix).
 * The browser API supports pageSize up to 40+ but requires session cookies.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_FILE = join(ROOT, "src", "data", "upwork-portfolio.json");

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: node scripts/transform-portfolio.mjs <raw.json>");
  console.error(
    "  where raw.json is the direct curl output from the browser session",
  );
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputFile, "utf-8"));
const projects = raw?.data?.talentPortfolioProjects?.projects;
if (!projects?.length) {
  console.error(
    "Unexpected input: missing data.talentPortfolioProjects.projects",
  );
  console.error(
    "Keys found:",
    Object.keys(raw?.data?.talentPortfolioProjects ?? {}),
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractYouTubeId(url) {
  const m = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────────────────────

function transformProject(p) {
  const id = slugify(p.title);

  // Skills — browser API uses ontologySkill.node.prefLabel or freeText
  const skills = (p.tags ?? [])
    .map(
      (t) =>
        t.ontologySkill?.node?.prefLabel ??
        t.freeText ??
        t.skill?.prettyName ??
        null,
    )
    .filter(Boolean);

  const attachments = [];

  // Project-level video
  if (p.videoUrl) {
    const ytId = extractYouTubeId(p.videoUrl);
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

  for (const att of p.attachments ?? []) {
    const attType = String(att.type ?? "");

    if (att.embeddedLinkUrl) {
      // Embedded external link (GitHub, Figma, etc.)
      attachments.push({
        type: String(att.embeddedLinkType ?? "link").toLowerCase(),
        url: String(att.embeddedLinkUrl),
        title: att.title ?? null,
      });
    } else if (attType === "video" && att.videoUrl) {
      const ytId = extractYouTubeId(att.videoUrl);
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
      const entry = {
        type: attType || "file",
        url: String(att.originalAttachment),
      };
      if (att.title) entry.title = att.title;
      if (att.description) entry.description = att.description;
      if (att.attachmentName) entry.fileName = att.attachmentName;
      if (att.attachmentSize) entry.fileSize = att.attachmentSize;
      if (att.imageSmall) entry.imageSmall = att.imageSmall;
      if (att.imageMiddle) entry.imageMiddle = att.imageMiddle;
      if (att.imageLarge) entry.imageLarge = att.imageLarge;
      attachments.push(entry);
    } else if (att.link) {
      attachments.push({
        type: attType || "link",
        url: String(att.link),
        title: att.title ?? null,
      });
    }
  }

  // Fallback thumbnail image
  if (p.thumbnail && !attachments.some((a) => a.type === "image")) {
    const thumbUrl = p.thumbnail.startsWith("http")
      ? p.thumbnail
      : `https://www.upwork.com${p.thumbnail}`;
    attachments.push({ type: "image", url: thumbUrl, thumbnail: thumbUrl });
  }

  const item = {
    id,
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    skills,
    rank: p.rank,
  };
  if (attachments.length) item.attachments = attachments;
  if (p.completionDate) item.completionDate = String(p.completionDate);
  if (p.projectUrl) item.url = String(p.projectUrl);

  return item;
}

// Sort by rank (1 = top of profile)
const sorted = [...projects].sort((a, b) => a.rank - b.rank);
const items = sorted.map(transformProject);

// De-duplicate IDs (same title → append rank suffix)
const seen = new Set();
for (const item of items) {
  if (seen.has(item.id)) {
    item.id = `${item.id}-${item.rank}`;
  }
  seen.add(item.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Write output
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();
const output = {
  profileUrl: "https://www.upwork.com/freelancers/~0188baee67e8f543e7",
  lastUpdated: now.toISOString().split("T")[0],
  source: "upwork-browser-graphql-api",
  sourceNote:
    "Fetched via Upwork talentPortfolioProjects GraphQL query (all items, paginated). " +
    "Requires browser session curl — see script header for instructions.",
  extractedAt: now.toISOString(),
  items,
};

writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

const withSkills = items.filter((i) => i.skills.length > 0).length;
const withAtts = items.filter((i) => i.attachments?.length).length;
console.log(
  `[transform-portfolio] ✓ Written ${items.length} items to src/data/upwork-portfolio.json`,
);
console.log(
  `[transform-portfolio]   ${withSkills} with skills, ${withAtts} with attachments`,
);
