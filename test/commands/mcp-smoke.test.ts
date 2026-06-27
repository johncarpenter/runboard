import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleStatus } from "../../mcp/handlers.js";
import { buildServer } from "../../mcp/server.js";
import { VERSION } from "../../src/version.js";

const EXPECTED_TOOLS = [
  "runboard_assess",
  "runboard_board",
  "runboard_pulse",
  "runboard_roadmap",
  "runboard_report",
  "runboard_status",
];

const openClients: Client[] = [];

async function connectedClient() {
  const server = buildServer();
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  openClients.push(client);
  return { server, client };
}

describe("MCP server smoke", () => {
  // Close connections even when an assertion throws, so open handles never leak.
  afterEach(async () => {
    await Promise.all(openClients.splice(0).map((c) => c.close()));
  });

  it("lists all six runboard tools", async () => {
    const { client } = await connectedClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("advertises the package version (no drift)", async () => {
    const { client } = await connectedClient();
    expect(client.getServerVersion()?.version).toBe(VERSION);
  });
});

describe("MCP tools in an uninitialised directory", () => {
  let empty: string;
  beforeEach(() => {
    empty = mkdtempSync(path.join(tmpdir(), "runboard-noinit-"));
  });
  afterEach(() => rmSync(empty, { recursive: true, force: true }));

  it("returns descriptive guidance rather than crashing opaquely", () => {
    // FR-009: the handler the tool wraps surfaces a clear 'run init' message.
    expect(() => handleStatus({ root: empty })).toThrow(/runboard init/);
  });
});
