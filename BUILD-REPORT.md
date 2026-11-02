# jsondiff — Build Report

MCP Rebuild 1000 (Tranche #101+ Batch 10). Clean-room rebuild of
keremurat/mcp (JSON Compare MCP Server; rank 596, 0★, Tier C),
built from the public spec in `specs-batch9/jsoncompare.md` and
recorded in `harness/fixtures/json-compare-tools-original.json`.
That fixture is docs-derived: the spec enumerates exactly 1 tool
whose parameters are named in a documented call example and whose
output format is fully documented, so parity proves the rebuild
matches this program's defined spec, labelled docs-derived. No
original code was read and no original server was probed. Local
build only — nothing pushed or published.

Identity: repo `jsondiff`, npm `@reneturcios/jsondiff`,
MCP name `io.github.CloudCorpRecords/jsondiff`, version `0.1.0`,
bin `jsondiff` → `dist/cli.js`.

## Files created (19/19 per TEMPLATE.md checklist)

- `package.json` — bin `jsondiff: dist/cli.js`, `mcpName` set,
  scripts build=`tsc` / dev=`tsx src/cli.ts` / test=`tsx --test test/*.test.ts`
- `server.json` — description "Compare two JSON documents deeply,
  ignoring key and array order, with every difference pathed."
  (≤100 chars); npm entry carries `version: 0.1.0`; OCI entry
  `ghcr.io/cloudcorprecords/jsondiff:0.1.0` carries **no**
  `version` field
- `Dockerfile` — node:20-alpine two-stage, ENTRYPOINT
  `node /app/dist/cli.js`, CMD `mcp`, label
  `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/jsondiff"`
- `tsconfig.json`, `.gitignore`, `LICENSE` (MIT, Copyright (c)
  2026 Rene Turcios), `README.md` (fresh text), `CHANGELOG.md`
  (single 0.1.0 entry, 2026-10-27)
- `src/index.ts`, `src/cli.ts` (`compare` with positional JSON
  strings or `--file1`/`--file2`, `mcp`, `--version`; exit 2
  usage / 1 runtime error, argument validation before any
  comparison), `src/mcp.ts`, `src/types.ts`, `src/jsondiff.ts`
  (core logic, `VERSION = "0.1.0"`)
- `test/jsondiff.test.ts`
- `.github/workflows/{ci,publish,publish-container,registry-publish}.yml`
  (image name and smoke-test server name set to jsondiff)

## Tools implemented (1)

The full documented set:

- `compare_json` — "Compare two JSON strings deeply and
  order-independently, and report every difference (missing keys,
  extra keys, value mismatches, type mismatches) with full path
  tracking." (the spec's marked close paraphrase/translation of
  the Turkish README). `json1`, `json2` (strings, required).

## Implementation notes

- `src/mcp.ts` uses the SDK's low-level `Server` with explicit
  inputSchema literals exactly matching the fixture, per the
  standing fleet rule; zod still validates every `tools/call`.
- Pure local computation: no upstream, no auth, no environment
  variables. Object keys are compared order-independently at
  every depth; the four documented difference kinds carry the
  documented fields (`type`, `path`, `key` for key differences,
  `file1_value` / `file2_value`, `message`), plus the documented
  `summary` counts and `identical` / `different` status.
- Inputs that are not strings, or strings that do not parse as
  JSON, are errors naming the offending input (`json1` / `json2`)
  — never a fabricated comparison.

## Spec ambiguities resolved

- **Array element differences:** the spec documents
  order-independent array comparison but no element-level diff
  format. Resolved as: an element of the first array with no
  deep-equal partner in the second is a `value_mismatch` at
  `path[index]` carrying `file1_value`, and the mirror image
  carries `file2_value` — recorded here and in the core header.
- **Requiredness:** the README publishes no formal schema; both
  parameters are required because the sole documented call always
  supplies both (spec records this basis).
- The README's documented scenario-2 totals (1 missing / 2 extra
  / 8 value / 0 type = 11) are for its sample files, whose
  contents are not reproduced; the tests instead pin each kind
  and the counting logic independently.

## Verification (foreground, coordinator re-run)

- `tsc --noEmit` exit 0; `npm run build` exit 0 (`dist/cli.js`)
- `npm test`: **16 tests, 16 pass, 0 fail** — order-independence
  (documented example, nested levels, arrays), self-comparison,
  each of the four difference kinds with paths/messages, mixed
  summary counting, unmatched array elements, nested-in-array
  differences, top-level arrays/primitives, invalid-JSON errors
  naming the input, non-string input rejection
- `dist/cli.js --version` → `0.1.0`; `compare '{"a":1}' '{"a":2}'`
  prints a `different` report with 1 difference
- Parity: `harness/parity.py` vs
  `harness/fixtures/json-compare-tools-original.json` →
  **PASS, parity 100.0, identical_tools 1/1**

## Lockfile status

`package-lock.json` generated clean via Route 3 (temp copy with
only `package.json`, offline `npm install --package-lock-only
--ignore-scripts --offline`), verified: parses, name
`@reneturcios/jsondiff`, **128 package entries**. Local
`node_modules` is a symlink to the sibling burnmeter tree, used
only for the local build/test; gitignored.

## Gaps / honest notes

- Docs-derived spec: parity proves the rebuild matches this
  program's defined spec, not a hand-probed original server.
- The MCP resource surface documented upstream is not a tool and
  is not applicable here (none documented for this server).
- Container build not exercised locally; the publish-container
  workflow smoke-tests the image at publish time.
