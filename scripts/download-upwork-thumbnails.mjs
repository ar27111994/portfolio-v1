#!/usr/bin/env node
/**
 * download-upwork-thumbnails.mjs
 *
 * Downloads auth-gated Upwork portfolio images using a browser session cookie,
 * saves them to public/upwork-covers/<item-id>-<index>.jpg, and patches
 * src/data/upwork-portfolio.json with localImage paths so cards use them.
 *
 * HOW TO GET YOUR SESSION COOKIE
 * --------------------------------
 * 1. Open Chrome → log into Upwork
 * 2. DevTools → Network → any upwork.com request → Headers → Request Headers
 * 3. Copy the full "cookie:" header value
 * 4. Run:
 *      npm run download-thumbnails -- --cookie "YOUR_COOKIE_STRING"
 *    or set env var:
 *      set UPWORK_COOKIE=YOUR_COOKIE_STRING && npm run download-thumbnails
 *
 * OPTIONS
 * -------
 *   --cookie "<string>"   Cookie header value (required unless env var set)
 *   --dry-run             Print URLs without downloading
 *   --item <id>           Only process one item by id
 *   --overwrite           Re-download even if local file already exists
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(ROOT, "public", "upwork-covers");
const JSON_FILE = join(ROOT, "src", "data", "upwork-portfolio.json");
const UPWORK_BASE = "https://www.upwork.com";

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const cookieIdx = args.indexOf("--cookie");
const cookie = cookieIdx >= 0 ? args[cookieIdx + 1] : process.env.UPWORK_COOKIE;
const dryRun = args.includes("--dry-run");
const overwrite = args.includes("--overwrite");
const itemFilter = args.includes("--item")
  ? args[args.indexOf("--item") + 1]
  : null;

if (!cookie && !dryRun) {
  console.error(
    "Error: --cookie <value> required (or set UPWORK_COOKIE env var).",
  );
  console.error("See script header for instructions on getting your cookie.");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Make a relative /att/ path absolute. Pass-through if already absolute. */
function toAbsolute(url) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${UPWORK_BASE}${url}`;
  return undefined;
}

/**
 * Find the best image URL from an attachment, handling both data shapes:
 *   Shape A (browser-session fetch): flat imageSmall/imageMiddle/imageLarge + relative urls
 *   Shape B (official API fetch):    nested image.large/medium/small + absolute urls
 * Prefers largest available. Returns an absolute URL or undefined.
 */
function bestImageUrl(att) {
  // Shape A: flat fields
  const flatLarge = toAbsolute(att.imageLarge);
  const flatMedium = toAbsolute(att.imageMiddle);
  const flatSmall = toAbsolute(att.imageSmall);
  // Shape B: nested image object
  const nestedLarge = toAbsolute(att.image?.large);
  const nestedMedium = toAbsolute(att.image?.medium);
  const nestedSmall = toAbsolute(att.image?.small);
  // Fallback: direct url or thumbnail
  const directUrl = toAbsolute(att.url);
  const thumb = toAbsolute(att.thumbnail);

  return (
    flatLarge ??
    nestedLarge ??
    flatMedium ??
    nestedMedium ??
    flatSmall ??
    nestedSmall ??
    directUrl ??
    thumb
  );
}

function isUpworkAuthUrl(url) {
  if (!url) return false;
  return url.includes("upwork.com/att/");
}

// ─── Load data ───────────────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(JSON_FILE, "utf-8"));
const items = data.items ?? [];

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Download helper ─────────────────────────────────────────────────────────
async function downloadImage(url, destPath, label) {
  if (!overwrite && existsSync(destPath)) {
    return "skip";
  }
  if (dryRun) {
    console.log(`  [dry-run] ${url.slice(0, 90)}`);
    console.log(`          → ${destPath}`);
    return "dry";
  }
  try {
    const res = await fetch(url, {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
        Referer: "https://www.upwork.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      console.warn(`  [${res.status}] ${label} — ${url.slice(0, 80)}`);
      return "fail";
    }
    const buf = await res.arrayBuffer();
    writeFileSync(destPath, Buffer.from(buf));
    const kb = Math.round(buf.byteLength / 1024);
    console.log(`  [ok] ${destPath} (${kb} KB)`);
    return "ok";
  } catch (err) {
    console.warn(`  [error] ${label}: ${err.message}`);
    return "fail";
  }
}

// ─── Main loop ───────────────────────────────────────────────────────────────
let nDownloaded = 0;
let nSkipped = 0;
let nFailed = 0;
let nPatched = 0;

for (const item of items) {
  if (itemFilter && item.id !== itemFilter) continue;

  const imageAtts = (item.attachments ?? []).filter((a) => {
    if (a.type !== "image") return false;
    if (a.localImage) return false; // already have a local copy
    const url = bestImageUrl(a);
    return url && isUpworkAuthUrl(url);
  });

  if (!imageAtts.length) continue;

  console.log(`\n${item.title} (${item.id}) — ${imageAtts.length} image(s)`);

  for (let idx = 0; idx < imageAtts.length; idx++) {
    const att = imageAtts[idx];
    const url = bestImageUrl(att);
    if (!url) continue;

    const filename = `${item.id}-${idx}.jpg`;
    const destPath = join(OUTPUT_DIR, filename);
    const publicPath = `/upwork-covers/${filename}`;
    const label = `${item.id}[${idx}]`;

    const result = await downloadImage(url, destPath, label);

    if (result === "ok" || result === "dry") {
      if (result === "ok") {
        att.localImage = publicPath;
        nPatched++;
      }
      nDownloaded++;
    } else if (result === "skip") {
      att.localImage = publicPath; // already on disk — still patch JSON
      nPatched++;
      nSkipped++;
    } else {
      nFailed++;
    }
  }
}

// ─── Patch JSON ──────────────────────────────────────────────────────────────
if (!dryRun && nPatched > 0) {
  writeFileSync(JSON_FILE, JSON.stringify(data, null, 2));
  console.log(
    `\n✓ Patched ${nPatched} attachment(s) with localImage in upwork-portfolio.json`,
  );
}

console.log(
  `\nDone: ${nDownloaded} downloaded, ${nSkipped} already on disk, ${nFailed} failed`,
);
if (nFailed > 0) {
  console.log(
    "Tip: some downloads failed — your cookie may be expired or incomplete.",
  );
  console.log(
    "     Copy the full 'cookie:' request header from Chrome DevTools and retry.",
  );
}
if (nDownloaded === 0 && nFailed === 0 && !dryRun) {
  console.log(
    "Nothing to download — either all images already have localImage paths,",
  );
  console.log("or no image attachments with Upwork auth URLs were found.");
  console.log("Run with --overwrite to force re-download existing files.");
}
