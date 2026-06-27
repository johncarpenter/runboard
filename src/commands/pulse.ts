import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { detectTriggers } from "../core/triggers.js";
import { loadAllAssessments } from "../data/assessments.js";
import { runboardPaths } from "../data/paths.js";
import { buildPulse } from "../render/reports.js";
import { UserError, requireInit } from "./shared.js";

export interface PulseOptions {
  root?: string;
}

export function runPulse(opts: PulseOptions = {}): {
  path: string;
  text: string;
  triggers: string[];
} {
  const root = opts.root ?? process.cwd();
  requireInit(root);
  const all = loadAllAssessments(root);
  if (all.length < 2) {
    throw new UserError(
      "Pulse needs at least two assessments to compare. Run `runboard assess` again later.",
    );
  }
  const current = all[all.length - 1];
  const previous = all[all.length - 2];
  if (!current || !previous) throw new Error("unreachable");

  const text = buildPulse(previous, current, all);
  const triggers = detectTriggers(all);

  const reportsDir = runboardPaths(root).reportsDir;
  mkdirSync(reportsDir, { recursive: true });
  const file = path.join(reportsDir, `pulse-${current.date}.md`);
  writeFileSync(file, text, "utf8");
  return { path: file, text, triggers };
}

export function registerPulse(program: Command): void {
  program
    .command("pulse")
    .description("Compare the two latest assessments; flag stuck dimensions.")
    .action(() => {
      const { path: file, triggers } = runPulse();
      process.stdout.write(`Wrote ${file}\n`);
      if (triggers.length > 0) {
        process.stdout.write(`\nAuto-triggers (stuck 3 assessments): ${triggers.join(", ")}\n`);
      } else {
        process.stdout.write("\nNothing is stuck across the last three assessments.\n");
      }
    });
}
