#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPORT_DIR = join(ROOT, ".lighthouseci");
const DIST_DIR = join(ROOT, "dist");
const PORT = Number(process.env.LIGHTHOUSE_PORT || 4329);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const URLS = ["/", "/privacy"];
const isWindows = process.platform === "win32";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function contentTypeFor(filePath) {
  return (
    MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream"
  );
}

function resolveDistPath(requestUrl) {
  const url = new URL(requestUrl, BASE_URL);
  const pathname = decodeURIComponent(url.pathname);

  let relativePath;
  if (pathname === "/") {
    relativePath = "index.html";
  } else if (pathname.endsWith("/")) {
    relativePath = `${pathname.slice(1)}index.html`;
  } else if (extname(pathname)) {
    relativePath = pathname.slice(1);
  } else {
    relativePath = `${pathname.slice(1)}/index.html`;
  }

  const candidate = resolve(DIST_DIR, normalize(relativePath));
  if (!candidate.startsWith(resolve(DIST_DIR))) {
    throw new Error(`Refusing to serve path outside dist/: ${pathname}`);
  }
  return candidate;
}

async function startStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const filePath = resolveDistPath(req.url || "/");
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(PORT, "127.0.0.1", () => {
      server.off("error", rejectPromise);
      resolvePromise();
    });
  });

  return server;
}

async function stopStaticServer(server) {
  await new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => {
      if (error) rejectPromise(error);
      else resolvePromise();
    });
  });
}

async function runLighthouse(url, reportPath) {
  const args = [
    "node_modules/lighthouse/cli/index.js",
    url,
    "--output=json",
    `--output-path=${reportPath}`,
    "--chrome-flags=--headless=new",
  ];

  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    stdout += text;
    process.stdout.write(text);
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderr += text;
    process.stderr.write(text);
  });

  const status = await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("close", resolvePromise);
  });

  const combinedOutput = `${stdout}${stderr}`;
  const softCleanupFailure =
    isWindows &&
    existsSync(reportPath) &&
    /EPERM|Permission denied|destroyTmp/.test(combinedOutput);

  if (status !== 0 && !softCleanupFailure) {
    throw new Error(`Lighthouse failed for ${url} with exit code ${status}`);
  }

  if (softCleanupFailure) {
    console.warn(
      `[lighthouse] Windows cleanup bug tolerated for ${url}; report was written successfully.`,
    );
  }
}

function runAssertions() {
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/@lhci/cli/src/cli.js",
      "assert",
      "--config=.lighthouserc.json",
      "--lhr=.lighthouseci",
      "--include-passed-assertions",
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Lighthouse assertions failed with exit code ${result.status}`,
    );
  }
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    throw new Error(
      "dist/ does not exist. Run `npm run build` before `npm run test:lighthouse`.",
    );
  }

  await rm(REPORT_DIR, { recursive: true, force: true });
  await mkdir(REPORT_DIR, { recursive: true });

  const server = await startStaticServer();

  try {
    for (const [index, route] of URLS.entries()) {
      const reportPath = join(REPORT_DIR, `lhr-${Date.now() + index}.json`);
      const targetUrl = new URL(route, `${BASE_URL}/`).toString();
      console.log(`[lighthouse] auditing ${targetUrl}`);
      await runLighthouse(targetUrl, reportPath);
    }

    runAssertions();
  } finally {
    await stopStaticServer(server);
  }
}

main().catch((error) => {
  console.error(`[run-lighthouse-ci] ${error.message}`);
  process.exit(1);
});
