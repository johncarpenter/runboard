// CI smoke test for the built MCP artifact: spawn `node dist/mcp.js` over stdio, list
// tools, and assert all six are present. Verifies the published entry actually boots —
// something the in-process vitest smoke test cannot (it never touches dist/).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const EXPECTED = [
  "runboard_assess",
  "runboard_board",
  "runboard_pulse",
  "runboard_roadmap",
  "runboard_report",
  "runboard_status",
];

const transport = new StdioClientTransport({ command: "node", args: ["dist/mcp.js"] });
const client = new Client({ name: "mcp-smoke", version: "0.0.0" });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  const missing = EXPECTED.filter((t) => !names.includes(t));
  if (missing.length > 0) {
    throw new Error(`dist/mcp.js is missing tools: ${missing.join(", ")}`);
  }
  const version = client.getServerVersion()?.version;
  process.stdout.write(`MCP smoke OK — runboard ${version}, ${names.length} tools.\n`);
  await client.close();
} catch (err) {
  process.stderr.write(`MCP smoke FAILED: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
