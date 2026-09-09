import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  contentBuf,
  contentsEqual,
  lineEndingOnlyDiff,
  readValidatedManifest,
  parseArgs,
} from "../../scripts/sync-ard-manifests.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const SCRIPT = path.join(REPO_ROOT, "scripts", "sync-ard-manifests.mjs");

const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const CRLF = CR + LF;

const lf = (s) => s.split("\n").join(LF);
const crlf = (s) => s.split("\n").join(CRLF);
const buf = (s) => Buffer.from(s, "utf8");
const bufLF = (s) => Buffer.from(lf(s), "utf8");
const bufCRLF = (s) => Buffer.from(crlf(s), "utf8");

// A manifest entry that satisfies the minimal ARD contract: a non-empty string
// `identifier`, a `type`, and one of `url`/`data`.
const validEntry = (id = "id-1", extra = {}) => ({
  identifier: id,
  type: "tool",
  url: `https://example.com/.well-known/${id}`,
  ...extra,
});

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    cwd: REPO_ROOT,
  });
}

function makeHarness(entries) {
  const root = mkdtempSync(path.join(tmpdir(), "ard-harness-"));
  const wk = path.join(root, ".well-known");
  mkdirSync(wk, { recursive: true });
  // `specVersion` is optional: `manifest()` (no arg) deliberately emits the
  // variant without specVersion/host, so the parameter must not be required.
  const manifest = (specVersion?: string) =>
    lf(
      JSON.stringify(
        specVersion
          ? { specVersion, host: "harness.local", entries }
          : { entries },
      ),
    );
  writeFileSync(path.join(wk, "ard.json"), manifest());
  writeFileSync(path.join(wk, "ai-catalog.json"), manifest("1.0"));
  return root;
}

describe("line-ending-insensitive content comparison", () => {
  it("contentBuf normalizes CRLF and lone CR to LF", () => {
    const input = crlf('{"a":1}\n{"b":2}\n');
    expect(contentBuf(buf(input)).toString()).toBe(lf('{"a":1}\n{"b":2}\n'));
  });

  it("contentsEqual treats LF and CRLF of the same content as equal", () => {
    expect(contentsEqual(bufLF('{"a":1}\n'), bufCRLF('{"a":1}\n'))).toBe(true);
  });

  it("contentsEqual distinguishes different content", () => {
    expect(contentsEqual(bufLF('{"a":1}\n'), bufLF('{"a":2}\n'))).toBe(false);
  });

  it("contentsEqual reports same raw bytes as equal", () => {
    const same = bufLF('{"a":1}\n');
    expect(contentsEqual(same, Buffer.from(same))).toBe(true);
  });

  it("lineEndingOnlyDiff is true only for a CRLF/LF-only difference", () => {
    expect(lineEndingOnlyDiff(bufLF('{"a":1}\n'), bufCRLF('{"a":1}\n'))).toBe(
      true,
    );
    expect(lineEndingOnlyDiff(bufLF('{"a":1}\n'), bufLF('{"a":1}\n'))).toBe(
      false,
    );
    expect(lineEndingOnlyDiff(bufLF('{"a":1}\n'), bufLF('{"a":2}\n'))).toBe(
      false,
    );
  });
});

describe("readValidatedManifest guard (mirrors agent-harness #484)", () => {
  let root;
  afterAll(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it("returns null for an empty entries array", () => {
    root = makeHarness([]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns entry count + specVersion for a valid manifest", () => {
    root = makeHarness([validEntry("x"), validEntry("y")]);
    const ok = readValidatedManifest(
      path.join(root, ".well-known", "ai-catalog.json"),
    );
    expect(ok).toMatchObject({ entries: 2, specVersion: "1.0" });
  });

  it("returns null when an entry is null", () => {
    root = makeHarness([null]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns null when an entry is an object literal missing required fields", () => {
    root = makeHarness([{}]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns null when an entry is missing a type", () => {
    root = makeHarness([{ identifier: "x", url: "https://example.com/x" }]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns null when an entry has neither url nor data", () => {
    root = makeHarness([{ identifier: "x", type: "tool" }]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("accepts a valid inline entry whose data is an object", () => {
    root = makeHarness([
      validEntry("inline-1", { url: undefined, data: { foo: "bar" } }),
    ]);
    const ok = readValidatedManifest(
      path.join(root, ".well-known", "ai-catalog.json"),
    );
    expect(ok).toMatchObject({ entries: 1 });
  });

  it("returns null when an entry has BOTH url and data", () => {
    root = makeHarness([validEntry("both-1", { data: { foo: "bar" } })]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns null when data is a string instead of an object", () => {
    root = makeHarness([
      validEntry("str-data", { url: undefined, data: "https://example.com/x" }),
    ]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns null when an entry has an empty identifier", () => {
    root = makeHarness([{ identifier: "", type: "tool", url: "u" }]);
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    root = makeHarness([validEntry("x")]);
    writeFileSync(path.join(root, ".well-known", "ard.json"), "{ not json");
    expect(
      readValidatedManifest(path.join(root, ".well-known", "ard.json")),
    ).toBeNull();
  });
});

describe("parseArgs", () => {
  it("parses --check and --agent-harness-path <p>", () => {
    expect(parseArgs(["--check", "--agent-harness-path", "C:/x"])).toEqual({
      check: true,
      agentHarnessPath: "C:/x",
    });
  });

  it("throws on unknown argument", () => {
    expect(() => parseArgs(["--bogus"])).toThrow(/unknown argument/);
  });
});

describe("CLI guard contract", () => {
  let root;
  afterAll(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it("refuses to sync an empty entries array (exit 1, nothing copied)", () => {
    root = makeHarness([]);
    const res = run(["--agent-harness-path", root]);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/empty/i);
  });

  it("refuses to sync invalid JSON (exit 1, nothing copied)", () => {
    root = makeHarness([]);
    writeFileSync(path.join(root, ".well-known", "ard.json"), "{ not json");
    const res = run(["--agent-harness-path", root]);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/not valid json/i);
  });

  it("refuses to sync a manifest with a malformed entry (exit 1, nothing copied)", () => {
    root = makeHarness([null, validEntry("a")]);
    const res = run(["--agent-harness-path", root]);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/invalid/i);
  });

  it("refuses to sync a manifest with an entry missing type (exit 1, nothing copied)", () => {
    root = makeHarness([
      { identifier: "x", url: "https://example.com/x" },
      validEntry("a"),
    ]);
    const res = run(["--agent-harness-path", root]);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/missing a non-empty string "type"/i);
  });
});
