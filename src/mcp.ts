/**
 * jsondiff MCP server. Tools: compare_json.
 *
 * Why the low-level Server instead of McpServer: the high-level
 * helper converts zod schemas to JSON Schema and injects keys that
 * are not in this tool's public spec ("$schema" and
 * "additionalProperties"), which breaks exact tool-list/schema
 * parity with the spec. This file serves tools/list with the
 * spec's exact input schemas as explicit literals, while zod still
 * validates every tools/call argument set.
 *
 * The comparison is pure local computation: no upstream API, no
 * authentication, no configuration.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { compareJson, formatPayload, VERSION } from "./jsondiff.js";

const CompareArgs = z.object({
  json1: z.string(),
  json2: z.string(),
});

const TOOLS = [
  {
    name: "compare_json",
    description:
      "Compare two JSON strings deeply and order-independently, and report every difference (missing keys, extra keys, value mismatches, type mismatches) with full path tracking.",
    inputSchema: {
      type: "object" as const,
      properties: {
        json1: { type: "string", description: "The first JSON document, as a JSON string" },
        json2: { type: "string", description: "The second JSON document, as a JSON string" },
      },
      required: ["json1", "json2"],
    },
  },
];

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  return {
    content: [
      { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "jsondiff", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let out: unknown;
    if (name === "compare_json") {
      const parsed = CompareArgs.parse(args ?? {});
      out = compareJson(parsed.json1, parsed.json2);
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return textResult(formatPayload(out));
  } catch (err) {
    if (err instanceof McpError) throw err;
    return errorResult(err);
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
