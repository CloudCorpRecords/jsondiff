# jsondiff

Compare two JSON documents deeply, without worrying about key or
array order. jsondiff walks both documents at every level and
reports each difference it finds — a key that exists on one side
only, a value that differs, or a value whose JSON type differs —
with the exact dotted path of the difference, a per-kind summary,
and an overall `identical` / `different` status.

It is pure local computation: no upstream API, no account, no API
key, no configuration.

## CLI

```bash
npx @reneturcios/jsondiff compare '<json1>' '<json2>'
npx @reneturcios/jsondiff compare --file1 a.json --file2 b.json
npx @reneturcios/jsondiff --version
```

Both inputs are JSON strings; with `--file1` / `--file2` they are
read from files instead. Output is the comparison report as JSON:

```json
{
  "status": "different",
  "total_differences": 2,
  "differences": [
    {
      "type": "missing_key",
      "path": "root.user.settings.language",
      "key": "language",
      "file1_value": "tr",
      "message": "Key 'language' exists in file1 but missing in file2"
    },
    {
      "type": "value_mismatch",
      "path": "root.user.name",
      "file1_value": "Ahmet Yılmaz",
      "file2_value": "Mehmet Demir",
      "message": "Value mismatch at 'root.user.name'"
    }
  ],
  "summary": {
    "missing_keys": 1,
    "extra_keys": 0,
    "value_mismatches": 1,
    "type_mismatches": 0
  }
}
```

Exit codes: `0` on success, `1` on a runtime error (including an
input that is not valid JSON — the error names the input), `2` on
a usage error.

## MCP server

The same bin serves a stdio MCP server:

```bash
npx -y @reneturcios/jsondiff mcp
```

MCP client config:

```json
{
  "mcpServers": {
    "jsondiff": {
      "command": "npx",
      "args": ["-y", "@reneturcios/jsondiff", "mcp"]
    }
  }
}
```

### Tools

- `compare_json` — Compare two JSON strings deeply and
  order-independently, and report every difference (missing keys,
  extra keys, value mismatches, type mismatches) with full path
  tracking.
  - `json1` (string, required) — the first JSON document, as a
    JSON string
  - `json2` (string, required) — the second JSON document, as a
    JSON string

Difference kinds: `missing_key` (in the first document only),
`extra_key` (in the second only), `value_mismatch` (same JSON
type, different content), `type_mismatch` (different JSON types).
Arrays are compared order-independently: an element with no
deep-equal partner on the other side is reported as a value
mismatch.

## Docker

```bash
docker run -i ghcr.io/cloudcorprecords/jsondiff            # stdio MCP server
docker run --rm ghcr.io/cloudcorprecords/jsondiff compare '{"a":1}' '{"a":2}'
```

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # tsx --test test/*.test.ts (pure local, no network)
npm run dev     # run the CLI from source
```

## License

MIT — Copyright (c) 2026 Rene Turcios
