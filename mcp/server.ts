import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  handleAssess,
  handleBoard,
  handlePulse,
  handleReport,
  handleRoadmap,
  handleStatus,
} from "./handlers.js";

const scoreShape = z.object({
  level: z.number().int().min(1).max(5),
  trajectory: z.enum(["up", "flat", "down", "volatile"]),
  evidence: z.string().default(""),
});

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function buildServer(): McpServer {
  const server = new McpServer({ name: "runboard", version: "0.1.0" });

  server.registerTool(
    "runboard_assess",
    {
      description: "Record a 9-dimension assessment (the model supplies scores).",
      inputSchema: {
        scores: z.record(z.string(), scoreShape),
        type: z.enum(["baseline", "pulse", "quarterly", "event"]).optional(),
        force: z.boolean().optional(),
      },
    },
    async (args) => json(handleAssess(args)),
  );

  server.registerTool(
    "runboard_board",
    {
      description: "Render the board summary; set html to also write board.html.",
      inputSchema: { html: z.boolean().optional() },
    },
    async (args) => json(handleBoard({ html: args.html })),
  );

  server.registerTool(
    "runboard_pulse",
    {
      description: "Compare the two latest assessments and flag stuck dimensions.",
      inputSchema: {},
    },
    async () => json(handlePulse({})),
  );

  server.registerTool(
    "runboard_roadmap",
    { description: "Generate a Now/Next/Later plan from the binding constraint.", inputSchema: {} },
    async () => json(handleRoadmap({})),
  );

  server.registerTool(
    "runboard_report",
    {
      description: "Render a report (board-update | baseline | monthly).",
      inputSchema: { type: z.enum(["board-update", "baseline", "monthly"]) },
    },
    async (args) => json(handleReport({ type: args.type })),
  );

  server.registerTool(
    "runboard_status",
    { description: "One-screen current state.", inputSchema: {} },
    async () => json(handleStatus({})),
  );

  return server;
}

async function main(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
