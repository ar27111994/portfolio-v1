#!/usr/bin/env node
/**
 * download-upwork-thumbnails.mjs
 *
 * Downloads auth-gated Upwork portfolio images using a browser session cookie,
 * saves them to public/upwork-covers/<item-id>-<index>.jpg, and patches
 * src/data/upwork-portfolio.json with local paths so cards show real thumbnails.
 *
 * WHY THIS IS NEEDED
 * ------------------
 * Upwork portfolio image URLs (upwork.com/att/download/…) require an active
 * Upwork session cookie to serve. Browsers that aren't logged in get a 403.
 * The only way to get these images is to download them once while authenticated.
 *
 * HOW TO GET YOUR SESSION COOKIE
 * --------------------------------
 * 1. Open Chrome → log into Upwork
 * 2. Open DevTools → Application → Cookies → https://www.upwork.com
 * 3. Copy the value of the `master_access_token` cookie (or `user_oauth2_v2`)
 * 4. Run: node scripts/download-upwork-thumbnails.mjs --cookie "master_access_token=<value>"
 *
 * Alternatively, copy the full Cookie header from any authenticated request:
 * DevTools → Network → any upwork.com request → Headers → Cookie
 * Then run: node scripts/download-upwork-thumbnails.mjs --cookie "<full-cookie-string>"
 *
 * OPTIONS
 * -------
 *   --cookie "<string>"   Cookie header value (required)
 *   --dry-run             Print what would be downloaded without saving
 *   --item <id>           Only process one item by id
 *   --overwrite           Re-download even if local file already exists
 *
 * OUTPUT
 * ------
 * Images are saved to: public/upwork-covers/<item-id>-<index>.jpg
 * JSON is patched:     src/data/upwork-portfolio.json
 *   - attachment.localImage set to "/upwork-covers/<item-id>-<index>.jpg"
 *   - This takes priority over the auth-gated URL in UpworkPortfolioCard.astro
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(ROOT, "public", "upwork-covers");
const JSON_FILE = join(ROOT, "src", "data", "upwork-portfolio.json");

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

// ─── Load data ───────────────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(JSON_FILE, "utf-8"));
const items = data.items ?? [];

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Download helper ─────────────────────────────────────────────────────────
async function downloadImage(url, destPath, itemId, label) {
  if (!overwrite && existsSync(destPath)) {
    console.log(`  [skip] already exists: ${destPath}`);
    return true;
  }
  if (dryRun) {
    console.log(`  [dry-run] would download → ${destPath}`);
    return true;
  }
  try {
    const res = await fetch(url, {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
        Referer: "https://www.upwork.com/",
      },
    });
    if (!res.ok) {
      console.warn(`  [warn] ${res.status} for ${url.slice(0, 80)}`);
      return false;
    }
    const buf = await res.arrayBuffer();
    writeFileSync(destPath, Buffer.from(buf));
    const kb = Math.round(buf.byteLength / 1024);
    console.log(`  [ok] ${destPath} (${kb} KB)`);
    return true;
  } catch (err) {
    console.warn(`  [error] ${label}: ${err.message}`);
    return false;
  }
}

// ─── Main loop ───────────────────────────────────────────────────────────────
let totalDownloaded = 0;
let totalSkipped = 0;
let totalFailed = 0;
let patchCount = 0;

for (const item of items) {
  if (itemFilter && item.id !== itemFilter) continue;

  const imageAtts = (item.attachments ?? []).filter(
    (a) =>
      a.type === "image" &&
      a.image?.large?.includes("upwork.com/att") &&
      !a.localImage,
  );

  if (!imageAtts.length) continue;

  console.log(`\n${item.title} (${item.id})`);

  for (let idx = 0; idx < imageAtts.length; idx++) {
    const att = imageAtts[idx];
    const ext = "jpg";
    const filename = `${item.id}-${idx}.${ext}`;
    const destPath = join(OUTPUT_DIR, filename);
    const publicPath = `/upwork-covers/${filename}`;

    // Try large → medium → small in order
    const urlToTry =
      att.image?.large ?? att.image?.medium ?? att.image?.small ?? att.url;
    if (!urlToTry) continue;

    const ok = await downloadImage(urlToTry, destPath, item.id, filename);
    if (ok) {
      if (!dryRun) {
        att.localImage = publicPath;
        patchCount++;
      }
      totalDownloaded++;
    } else {
      totalFailed++;
    }
  }
}

// ─── Patch JSON ──────────────────────────────────────────────────────────────
if (!dryRun && patchCount > 0) {
  writeFileSync(JSON_FILE, JSON.stringify(data, null, 2));
  console.log(
    `\n✓ Patched ${patchCount} attachment(s) with localImage paths in upwork-portfolio.json`,
  );
}

console.log(
  `\nDone: ${totalDownloaded} downloaded, ${totalSkipped} skipped, ${totalFailed} failed`,
);
if (totalFailed > 0) {
  console.log(
    "Some downloads failed — your cookie may be expired. Refresh it from the browser and retry.",
  );
}
