/**
 * jsondiff core: deep, order-independent comparison of two JSON
 * documents supplied as JSON strings.
 *
 *   compareJson(json1, json2) -> CompareResult
 *
 * Object key order never matters, at any depth. Arrays are also
 * compared order-independently: two arrays are equal when they
 * hold the same elements (deep-equal) the same number of times, in
 * any order. Differences use the four documented kinds:
 *
 *   missing_key    a key exists in the first document only
 *   extra_key      a key exists in the second document only
 *   value_mismatch both sides have a value at the path, same JSON
 *                  type, different content
 *   type_mismatch  both sides have a value at the path, of
 *                  different JSON types
 *
 * Paths are dotted from "root" ("root.user.settings.theme");
 * array elements append "[index]". The spec documents the object
 * behaviour and the output format; the array element reporting is
 * a documented local choice: an element of the first array with
 * no deep-equal partner in the second is a value_mismatch
 * carrying file1_value, and the mirror image carries file2_value.
 *
 * An input that is not a string, or a string that does not parse
 * as JSON, is an error naming the offending input — never a
 * fabricated comparison.
 */
import type { CompareResult, Difference } from "./types.js";

export const VERSION = "0.1.0";

/** The JSON type of a parsed value. */
function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Structural equality with object key order ignored. */
function deepEqual(a: unknown, b: unknown): boolean {
  const diffs: Difference[] = [];
  collect(a, b, "root", diffs);
  return diffs.length === 0;
}

function collect(a: unknown, b: unknown, path: string, out: Difference[]): void {
  const typeA = jsonType(a);
  const typeB = jsonType(b);
  if (typeA !== typeB) {
    out.push({
      type: "type_mismatch",
      path,
      file1_value: a,
      file2_value: b,
      message: `Type mismatch at '${path}': ${typeA} vs ${typeB}`,
    });
    return;
  }
  if (isRecord(a) && isRecord(b)) {
    for (const key of Object.keys(a)) {
      const childPath = `${path}.${key}`;
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        out.push({
          type: "missing_key",
          path: childPath,
          key,
          file1_value: a[key],
          message: `Key '${key}' exists in file1 but missing in file2`,
        });
      } else {
        collect(a[key], b[key], childPath, out);
      }
    }
    for (const key of Object.keys(b)) {
      if (!Object.prototype.hasOwnProperty.call(a, key)) {
        out.push({
          type: "extra_key",
          path: `${path}.${key}`,
          key,
          file2_value: b[key],
          message: `Key '${key}' exists in file2 but missing in file1`,
        });
      }
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const unmatched = [...b];
    a.forEach((element, index) => {
      const partner = unmatched.findIndex((candidate) => deepEqual(element, candidate));
      if (partner >= 0) {
        unmatched.splice(partner, 1);
      } else {
        out.push({
          type: "value_mismatch",
          path: `${path}[${index}]`,
          file1_value: element,
          message: `Value mismatch at '${path}[${index}]'`,
        });
      }
    });
    for (const element of unmatched) {
      out.push({
        type: "value_mismatch",
        path,
        file2_value: element,
        message: `Value mismatch at '${path}'`,
      });
    }
    return;
  }
  if (a !== b) {
    out.push({
      type: "value_mismatch",
      path,
      file1_value: a,
      file2_value: b,
      message: `Value mismatch at '${path}'`,
    });
  }
}

function parseInput(value: unknown, label: string): unknown {
  if (typeof value !== "string") {
    throw new Error(`${label} is required and must be a JSON string`);
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error(
      `${label} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** Compare two JSON documents given as JSON strings. */
export function compareJson(json1: unknown, json2: unknown): CompareResult {
  const first = parseInput(json1, "json1");
  const second = parseInput(json2, "json2");
  const differences: Difference[] = [];
  collect(first, second, "root", differences);
  const summary = {
    missing_keys: differences.filter((d) => d.type === "missing_key").length,
    extra_keys: differences.filter((d) => d.type === "extra_key").length,
    value_mismatches: differences.filter((d) => d.type === "value_mismatch").length,
    type_mismatches: differences.filter((d) => d.type === "type_mismatch").length,
  };
  return {
    status: differences.length === 0 ? "identical" : "different",
    total_differences: differences.length,
    differences,
    summary,
  };
}

/** Render a payload as the JSON text block MCP clients show. */
export function formatPayload(payload: unknown): string {
  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}
