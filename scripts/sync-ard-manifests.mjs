#!/usr/bin/env node
/**
 * Sync ARD well-known manifests from the agent-harness repo into this
 * portfolio's public/.well-known/ directory (Option-B sync model).
 *
 * The ARD / AI-catalog manifests are generated + committed by agent-harness
 * (agent-harness/.well-known/{ard,ai-catalog}.json) but they are ACTUALLY
 * served at ar27111994.dev by this Astro/Vercel site from public/.well-known/.
 * This script is the explicit sync step that keeps the two in lockstep.
 *
 * Usage:
 *   node scripts/sync-ard-manifests.mjs                  # sync (copy) into public/.well-known
 *   node scripts/sync-ard-manifests.mjs --check          # verify parity only (no writes)
 *   node scripts/sync-ard-manifests.mjs --agent-harness-path /path/to/agent-harness
 *   AGENT_HARNESS_REPO=/path/to/agent-harness node scripts/sync-ard-manifests.mjs
 *
 * Exit codes: 0 = success (in --check mode: all targets in sync); 1 = any
 * source manifest invalid/empty, OR (in --check mode) any target out of sync.
 *
 * Dependency-free (node:fs / node:path / node:url / node:process only) and
 * cross-platform: agent-harness paths may be given as native forward-slash
 * Windows paths (C:/...) or as relative paths; everything else resolves via
 * path.join / path.resolve from the script's own location, never from CWD.
 *
 * Line endings: parity checks and change detection compare LOGICAL content
 * with line endings normalized, so a lone CRLF/LF difference (e.g. a
 * `core.autocrlf=true` checkout renders the LF blob as CRLF) never registers
 * as a real import/export change.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MANIFESTS = ["ard.json", "ai-catalog.json"];

const CR = String.fromCharCode(13); // "\r"
const LF = String.fromCharCode(10); // "\n"
const CRLF = CR + LF;

// The portfolio repo root is the parent of scripts/ (where this file lives),
// resolved from the module URL so it is independent of the caller's CWD.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const TARGET_DIR = path.join(REPO_ROOT, "public", ".well-known");

function parseArgs(argv) {
  const args = { check: false, agentHarnessPath: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") {
      args.check = true;
    } else if (arg === "--agent-harness-path") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--agent-harness-path requires a value");
      }
      args.agentHarnessPath = value;
      i += 1;
    } else if (arg.startsWith("--agent-harness-path=")) {
      args.agentHarnessPath = arg.slice("--agent-harness-path=".length);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function resolveAgentHarnessPath(cliValue) {
  // Precedence: --agent-harness-path <p> > AGENT_HARNESS_REPO > sibling ../agent-harness.
  const candidate =
    cliValue ??
    process.env.AGENT_HARNESS_REPO ??
    path.join(REPO_ROOT, "..", "agent-harness");
  if (!path.isAbsolute(candidate)) {
    // Relative paths are resolved against the portfolio repo root for
    // consistency (not the caller's CWD), so a bare `../agent-harness` works
    // regardless of where the command is run from.
    return path.resolve(REPO_ROOT, candidate);
  }
  return candidate;
}

/**
 * Validate a single ARD catalog entry against the minimal contract: every
 * entry must be an object carrying a non-empty string `identifier`, a non-empty
 * string `type`, and exactly ONE locator — either a non-empty string `url` or
 * an object-valued `data` (never both, never neither). Returns a reason string
 * when invalid, or null for a valid entry, so a manifest containing a malformed
 * entry ([null], [{}], a missing `type`, both url+data, neither, etc.) is never
 * copied forward — same fail-closed spirit as the empty-array guard that
 * already mirrors agent-harness #484.
 */
function entryError(entry, index) {
  const label = `  [invalid] entries[${index}]: `;
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return `${label}must be an object, got ${entry === null ? "null" : Array.isArray(entry) ? "array" : typeof entry}`;
  }
  if (typeof entry.identifier !== "string" || entry.identifier.length === 0) {
    return `${label}missing a non-empty string "identifier"`;
  }
  if (typeof entry.type !== "string" || entry.type.length === 0) {
    return `${label}missing a non-empty string "type"`;
  }
  const urlPresent = entry.url !== undefined;
  const dataPresent = entry.data !== undefined;
  if (urlPresent && dataPresent) {
    return `${label}must not specify both "url" and "data"`;
  }
  if (!urlPresent && !dataPresent) {
    return `${label}must specify exactly one of "url" or "data"`;
  }
  if (urlPresent) {
    if (typeof entry.url !== "string" || entry.url.length === 0) {
      return `${label}"url" must be a non-empty string`;
    }
  } else if (
    entry.data === null ||
    typeof entry.data !== "object" ||
    Array.isArray(entry.data)
  ) {
    return `${label}"data" must be an object (not a string/array/null)`;
  }
  return null;
}

/**
 * Validate a manifest: must parse as JSON, expose a non-empty `entries`
 * array, and every entry must satisfy the minimal ARD contract. Returns
 * { entries, specVersion?, host? } on success, or null if the manifest is
 * invalid/empty/has a malformed entry. Never allow a plausible-but-empty (or
 * malformed) manifest to be copied forward (mirrors agent-harness #484's
 * publish-gate contract).
 */
function readValidatedManifest(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(
      `  [invalid] ${filePath}: cannot read (${err.code ?? err.message})`,
    );
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`  [invalid] ${filePath}: not valid JSON (${err.message})`);
    return null;
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.entries)) {
    console.error(
      `  [invalid] ${filePath}: expected an object with an "entries" array`,
    );
    return null;
  }
  if (data.entries.length === 0) {
    console.error(
      `  [invalid] ${filePath}: "entries" array is empty — refusing to sync`,
    );
    return null;
  }
  for (let i = 0; i < data.entries.length; i += 1) {
    const err = entryError(data.entries[i], i);
    if (err) {
      console.error(`  [invalid] ${filePath}: ${err} — refusing to sync`);
      return null;
    }
  }
  return {
    entries: data.entries.length,
    specVersion: data.specVersion,
    host: data.host,
  };
}

function loadSourceManifests(agentHarnessRoot) {
  const resolved = {};
  for (const name of MANIFESTS) {
    const srcPath = path.join(agentHarnessRoot, ".well-known", name);
    const validated = readValidatedManifest(srcPath);
    if (!validated) {
      return null; // fail-fast: never copy if ANY source manifest is bad
    }
    resolved[name] = { sourcePath: srcPath, ...validated };
  }
  return resolved;
}

function targetPath(name) {
  return path.join(TARGET_DIR, name);
}

// Return the buffer with line endings normalized to LF, so CRLF/LF-only
// differences never count as a real content change (autocrlf checkout).
function contentBuf(buf) {
  const s = buf.toString("utf8");
  if (!s.includes(CR)) return buf;
  const normalized = s.split(CRLF).join(LF).split(CR).join(LF);
  return Buffer.from(normalized, "utf8");
}

function contentsEqual(a, b) {
  return Buffer.compare(contentBuf(a), contentBuf(b)) === 0;
}

// True when raw bytes differ but normalized content is identical (line-ending
// style difference only, not a manifest change).
function lineEndingOnlyDiff(a, b) {
  return Buffer.compare(a, b) !== 0 && contentsEqual(a, b);
}

function renderSuffix(meta) {
  const parts = [];
  if (meta.specVersion) parts.push(`specVersion=${meta.specVersion}`);
  // `host` may be a plain string on ard.json or a descriptive object (with a
  // displayName) on the ai-catalog.json. Render a stable, short label.
  const host = meta.host;
  if (typeof host === "string" && host) {
    parts.push(`host=${host}`);
  } else if (host && typeof host === "object" && host.displayName) {
    parts.push(`host=${host.displayName}`);
  }
  return parts.length ? ` (${parts.join(", ")})` : "";
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  const agentHarnessRoot = resolveAgentHarnessPath(args.agentHarnessPath);
  const sources = loadSourceManifests(agentHarnessRoot);

  if (!sources) {
    console.error(
      "sync-ard-manifests: one or more source manifests are invalid or empty — " +
        "nothing was copied. Ensure agent-harness has generated .well-known/{ard,ai-catalog}.json. " +
        `(looked under ${agentHarnessRoot})`,
    );
    process.exit(1);
  }

  if (args.check) {
    // Verify-only: compare each source to its committed target; never write.
    let anyDrift = false;
    console.log(`sync-ard-manifests --check (source: ${agentHarnessRoot})`);
    for (const name of MANIFESTS) {
      const src = sources[name];
      const dstPath = targetPath(name);
      const srcBytes = readFileSync(src.sourcePath);
      let tgtBytes;
      try {
        tgtBytes = readFileSync(dstPath);
      } catch {
        tgtBytes = null; // missing target -> drift
      }
      const contentEq = tgtBytes !== null && contentsEqual(tgtBytes, srcBytes);
      const rawEq =
        tgtBytes !== null && Buffer.compare(tgtBytes, srcBytes) === 0;
      if (!contentEq) anyDrift = true;
      const note = contentEq && !rawEq ? " (line endings only)" : "";
      console.log(
        `  ${contentEq ? "OK   " : "DIFF "} ${name}: ${src.entries} entries / ` +
          `${srcBytes.length} bytes (target ${tgtBytes ? tgtBytes.length : "missing"} bytes)${note}`,
      );
    }
    if (anyDrift) {
      console.error(
        "sync-ard-manifests --check: one or more targets differ from the source — " +
          "run `npm run sync:ard` (without --check) to update public/.well-known/.",
      );
      process.exit(1);
    }
    console.log("sync-ard-manifests --check: all targets in sync.");
    return;
  }

  // Sync mode: copy both manifests into public/.well-known/ (only when the
  // LOGICAL content differs, so a CRLF/LF-only difference is not rewritten).
  mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`sync-ard-manifests (source: ${agentHarnessRoot})`);
  let anyChanged = false;
  for (const name of MANIFESTS) {
    const src = sources[name];
    const dstPath = targetPath(name);
    const srcBytes = readFileSync(src.sourcePath);
    let existing;
    try {
      existing = readFileSync(dstPath);
    } catch {
      existing = null;
    }
    const contentEq = existing !== null && contentsEqual(existing, srcBytes);
    const rawEq = existing !== null && Buffer.compare(existing, srcBytes) === 0;
    const changed = !contentEq; // rewrite only on real content drift
    if (changed) {
      writeFileSync(dstPath, srcBytes);
      anyChanged = true;
    }
    const note = contentEq && !rawEq ? " (line endings only)" : "";
    console.log(
      `  ${changed ? "SYNCED " : "UNCHANGED"} ${name}: ${src.entries} entries / ` +
        `${srcBytes.length} bytes${changed ? ` (prev ${existing ? existing.length : "missing"} bytes)` : ""}` +
        note +
        renderSuffix(src),
    );
  }
  console.log(
    anyChanged
      ? "sync-ard-manifests: copied manifest(s) into public/.well-known/."
      : "sync-ard-manifests: already in sync — nothing to write.",
  );
}

// Allow the pure helpers to be unit-tested without running the CLI. main()
// only runs when this module is the direct entrypoint (not when imported).
export {
  contentBuf,
  contentsEqual,
  lineEndingOnlyDiff,
  readValidatedManifest,
  parseArgs,
  resolveAgentHarnessPath,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
