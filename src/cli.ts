import { Command } from "commander";
import { startMcpServer } from "../mcp/server.js";
import { registerAssess } from "./commands/assess.js";
import { registerBoard } from "./commands/board.js";
import { registerInit } from "./commands/init.js";
import { registerPulse } from "./commands/pulse.js";
import { registerReport } from "./commands/report.js";
import { registerRoadmap } from "./commands/roadmap.js";
import { UserError } from "./commands/shared.js";
import { registerStatus } from "./commands/status.js";
import { VERSION } from "./version.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("runboard")
    .description("Local-first technical-leadership maturity scorecard.")
    .version(VERSION, "-v, --version");

  registerInit(program);
  registerAssess(program);
  registerBoard(program);
  registerPulse(program);
  registerRoadmap(program);
  registerReport(program);
  registerStatus(program);

  program
    .command("mcp")
    .description("Start the MCP server over stdio (for tool-calling AI clients).")
    .action(async () => {
      await startMcpServer();
    });

  return program;
}

// No side effects on import — the bin entry (src/main.ts → dist/cli.js) calls this. Tests
// import buildProgram/main without spawning the CLI.
export async function main(argv: string[]): Promise<void> {
  const program = buildProgram();
  try {
    await program.parseAsync(argv);
  } catch (err) {
    if (err instanceof UserError) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}
