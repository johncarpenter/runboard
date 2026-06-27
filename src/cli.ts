import { Command } from "commander";
import { registerAssess } from "./commands/assess.js";
import { registerBoard } from "./commands/board.js";
import { registerInit } from "./commands/init.js";
import { registerPulse } from "./commands/pulse.js";
import { registerReport } from "./commands/report.js";
import { registerRoadmap } from "./commands/roadmap.js";
import { UserError } from "./commands/shared.js";
import { registerStatus } from "./commands/status.js";

const VERSION = "0.1.0";

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

  return program;
}

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

main(process.argv).catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
