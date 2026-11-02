/**
 * jsondiff types.
 *
 * jsondiff compares two JSON documents given as JSON strings and
 * reports every difference it finds. A difference is one of four
 * kinds (the documented set): a key present in the first document
 * but missing in the second, a key present only in the second, a
 * value mismatch at a path present in both, or a type mismatch at
 * a path present in both. The result also carries a summary count
 * per kind and a status of "identical" when there are none.
 */

/** The four documented difference kinds. */
export type DifferenceType =
  | "missing_key"
  | "extra_key"
  | "value_mismatch"
  | "type_mismatch";

/** One difference between the two documents. */
export interface Difference {
  type: DifferenceType;
  /** Dotted path from the root, e.g. "root.user.settings.theme". */
  path: string;
  /** The object key involved; present for missing_key / extra_key. */
  key?: string;
  /** The value in the first document, when that side has one. */
  file1_value?: unknown;
  /** The value in the second document, when that side has one. */
  file2_value?: unknown;
  message: string;
}

/** Per-kind counts of a comparison. */
export interface CompareSummary {
  missing_keys: number;
  extra_keys: number;
  value_mismatches: number;
  type_mismatches: number;
}

/** The full result of comparing two JSON documents. */
export interface CompareResult {
  status: "identical" | "different";
  total_differences: number;
  differences: Difference[];
  summary: CompareSummary;
}
