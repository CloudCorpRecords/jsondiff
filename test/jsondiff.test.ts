import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareJson } from "../src/jsondiff.js";

/**
 * All tests are pure local computation: no network, no fixtures
 * beyond inline JSON strings. The cases mirror the documented
 * test scenarios (order-independence, difference detection,
 * self-comparison) plus the four documented difference kinds.
 */

describe("compareJson — identical documents", () => {
  it("reports identical for the documented order-independence example", () => {
    const out = compareJson(
      '{"name": "Ahmet", "age": 30, "city": "Istanbul"}',
      '{"age": 30, "city": "Istanbul", "name": "Ahmet"}',
    );
    assert.equal(out.status, "identical");
    assert.equal(out.total_differences, 0);
    assert.deepEqual(out.differences, []);
    assert.deepEqual(out.summary, {
      missing_keys: 0,
      extra_keys: 0,
      value_mismatches: 0,
      type_mismatches: 0,
    });
  });

  it("reports identical for a document compared with itself", () => {
    const doc = '{"a": [1, 2, {"b": true}], "c": null}';
    const out = compareJson(doc, doc);
    assert.equal(out.status, "identical");
    assert.equal(out.total_differences, 0);
  });

  it("ignores key order at every nesting level", () => {
    const out = compareJson(
      '{"user": {"name": "A", "settings": {"theme": "dark", "lang": "tr"}}}',
      '{"user": {"settings": {"lang": "tr", "theme": "dark"}, "name": "A"}}',
    );
    assert.equal(out.status, "identical");
  });

  it("compares arrays order-independently", () => {
    const out = compareJson('{"tags": ["a", "b", "c"]}', '{"tags": ["c", "a", "b"]}');
    assert.equal(out.status, "identical");
  });
});

describe("compareJson — difference kinds", () => {
  it("reports a missing key with path, key, value, and the documented message", () => {
    const out = compareJson(
      '{"user": {"settings": {"language": "tr"}}}',
      '{"user": {"settings": {}}}',
    );
    assert.equal(out.status, "different");
    assert.equal(out.total_differences, 1);
    assert.deepEqual(out.differences[0], {
      type: "missing_key",
      path: "root.user.settings.language",
      key: "language",
      file1_value: "tr",
      message: "Key 'language' exists in file1 but missing in file2",
    });
    assert.equal(out.summary.missing_keys, 1);
  });

  it("reports an extra key with the second document's value", () => {
    const out = compareJson('{"a": 1}', '{"a": 1, "b": 2}');
    assert.equal(out.total_differences, 1);
    assert.equal(out.differences[0].type, "extra_key");
    assert.equal(out.differences[0].path, "root.b");
    assert.equal(out.differences[0].key, "b");
    assert.equal(out.differences[0].file2_value, 2);
    assert.equal(out.summary.extra_keys, 1);
  });

  it("reports a value mismatch with both values and the tracked path", () => {
    const out = compareJson('{"user": {"name": "Ahmet"}}', '{"user": {"name": "Mehmet"}}');
    assert.deepEqual(out.differences[0], {
      type: "value_mismatch",
      path: "root.user.name",
      file1_value: "Ahmet",
      file2_value: "Mehmet",
      message: "Value mismatch at 'root.user.name'",
    });
    assert.equal(out.summary.value_mismatches, 1);
  });

  it("reports a type mismatch when the JSON types differ", () => {
    const out = compareJson('{"age": 30}', '{"age": "30"}');
    assert.equal(out.differences[0].type, "type_mismatch");
    assert.equal(out.differences[0].path, "root.age");
    assert.equal(out.differences[0].file1_value, 30);
    assert.equal(out.differences[0].file2_value, "30");
    assert.equal(out.summary.type_mismatches, 1);
  });

  it("treats null vs a value as a type mismatch, and a number vs boolean likewise", () => {
    const out = compareJson('{"a": null, "b": 1}', '{"a": 0, "b": true}');
    assert.equal(out.summary.type_mismatches, 2);
    assert.equal(out.total_differences, 2);
  });

  it("accumulates mixed differences and counts the summary by kind", () => {
    const out = compareJson(
      '{"keep": 1, "gone": 2, "changed": "x", "typed": 5}',
      '{"keep": 1, "changed": "y", "typed": "5", "new": 9}',
    );
    assert.equal(out.total_differences, 4);
    assert.deepEqual(out.summary, {
      missing_keys: 1,
      extra_keys: 1,
      value_mismatches: 1,
      type_mismatches: 1,
    });
    assert.equal(out.differences.length, out.total_differences);
  });

  it("reports unmatched array elements as value mismatches", () => {
    const out = compareJson('{"ids": [1, 2, 3]}', '{"ids": [1, 2, 4]}');
    assert.equal(out.status, "different");
    assert.equal(out.summary.value_mismatches, 2);
    assert.equal(out.differences[0].path, "root.ids[2]");
    assert.equal(out.differences[0].file1_value, 3);
    assert.equal(out.differences[1].file2_value, 4);
  });

  it("detects a difference inside an object nested in an array", () => {
    const out = compareJson(
      '{"items": [{"id": 1, "v": "a"}]}',
      '{"items": [{"id": 1, "v": "b"}]}',
    );
    assert.equal(out.status, "different");
    assert.equal(out.total_differences, 2);
  });

  it("compares top-level arrays and primitives", () => {
    assert.equal(compareJson("[1,2]", "[2,1]").status, "identical");
    assert.equal(compareJson('"a"', '"b"').summary.value_mismatches, 1);
    assert.equal(compareJson("42", "42").status, "identical");
  });
});

describe("compareJson — input validation", () => {
  it("rejects invalid JSON in the first input, naming it", () => {
    assert.throws(() => compareJson("{not json", "{}"), /json1 is not valid JSON/);
  });

  it("rejects invalid JSON in the second input, naming it", () => {
    assert.throws(() => compareJson("{}", "[1,"), /json2 is not valid JSON/);
  });

  it("rejects non-string inputs", () => {
    assert.throws(() => compareJson(undefined, "{}"), /json1 is required/);
    assert.throws(() => compareJson("{}", null), /json2 is required/);
    assert.throws(() => compareJson({ a: 1 }, "{}"), /json1 is required/);
  });
});
