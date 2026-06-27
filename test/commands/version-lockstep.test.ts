import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { buildServer } from "../../mcp/server.js";
import { buildProgram } from "../../src/cli.js";
import { VERSION } from "../../src/version.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(here, "../../package.json"), "utf8")) as {
  version: string;
};

describe("version lockstep (FR-004, SC-003)", () => {
  it("CLI --version equals the package version", () => {
    expect(buildProgram().version()).toBe(pkg.version);
  });

  it("the version module equals the package version", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("the MCP server advertises the package version", async () => {
    const server = buildServer();
    const client = new Client({ name: "test", version: "0.0.0" });
    const [c, s] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(s), client.connect(c)]);
    expect(client.getServerVersion()?.version).toBe(pkg.version);
    await client.close();
  });
});
