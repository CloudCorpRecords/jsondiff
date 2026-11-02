# Changelog

## 0.1.0 (2026-10-27)

- Initial release: `compare_json` MCP tool and `compare` CLI command
  for deep, order-independent comparison of two JSON documents given
  as strings (or files, via `--file1`/`--file2`).
- Reports missing keys, extra keys, value mismatches, and type
  mismatches, each with a dotted path from the root, plus a per-kind
  summary and an `identical` / `different` status.
