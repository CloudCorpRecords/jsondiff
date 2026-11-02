#!/usr/bin/env node
/**
 * jsondiff CLI.
 *
 *   jsondiff compare <json1> <json2>
 *   jsondiff compare --file1 <path> --file2 <path>
 *   jsondiff mcp
 *
 * Pure local computation. No API key, no configuration.
 * Argument validation happens before any comparison.
 * Exit codes: 0 success, 1 runtime error (including invalid
 * JSON input), 2 usage error.
 */
import { readFileSync } from "node:fs";
import { compareJson, formatPayload, VERSION } from "./jsondiff.js";

function usage(): never {
  console.error(`Usage:
  jsondiff compare <json1> <json2>
  jsondiff compare --file1 <path> --file2 <path>
  jsondiff mcp
  jsondiff --version

Both inputs are JSON strings (or files holding JSON, with the --file flags).`);
  process.exit(2);
}

function flag(rest: string[], name: string): string | undefined {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
}

function positionalArgs(rest: string[], valueFlags: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    if (valueFlags.includes(rest[i])) {
      i++;
    } else {
      out.push(rest[i]);
    }
  }
  return out;
}

function readJsonFile(path: string, label: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    console.error(
      `error: cannot read ${label} file '${path}': ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }
  if (cmd === "mcp") {
    await import("./mcp.js");
    return;
  }
  if (cmd !== "compare") usage();

  // ---- Argument validation (before any comparison) ----
  const fileFlags = ["--file1", "--file2"];
  const hasFileFlags = rest.some((a) => fileFlags.includes(a));
  const pos = positionalArgs(rest, fileFlags);
  let json1: string;
  let json2: string;
  if (hasFileFlags) {
    if (pos.length !== 0) usage();
    const f1 = flag(rest, "--file1");
    const f2 = flag(rest, "--file2");
    if (f1 === undefined || f2 === undefined) usage();
    json1 = readJsonFile(f1, "--file1");
    json2 = readJsonFile(f2, "--file2");
  } else {
    if (pos.length !== 2) usage();
    [json1, json2] = pos;
  }

  try {
    const out = compareJson(json1, json2);
    console.log(formatPayload(out));
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

void main();
