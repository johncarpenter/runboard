import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { latestAssessment, listAssessmentDates, loadAllAssessments } from "../data/assessments.js";
import { runboardPaths } from "../data/paths.js";
import { loadRubric } from "../data/rubric.js";
import { buildReport } from "../render/reports.js";
import { UserError, requireAssessments, requireInit } from "./shared.js";

export interface ReportOptions {
  root?: string;
  type: string;
}

export function runReport(opts: ReportOptions): { path: string; text: string } {
  const root = opts.root ?? process.cwd();
  requireInit(root);
  requireAssessments(listAssessmentDates(root));
  if (!opts.type) {
    throw new UserError("report requires --type board-update|baseline|monthly.");
  }
  const assessment = latestAssessment(root);
  if (!assessment) throw new Error("unreachable");
  const rubric = loadRubric(runboardPaths(root).rubric);
  const history = loadAllAssessments(root);

  const text = buildReport(opts.type, assessment, rubric, history);

  const reportsDir = runboardPaths(root).reportsDir;
  mkdirSync(reportsDir, { recursive: true });
  const file = path.join(reportsDir, `${opts.type}-${assessment.date}.md`);
  writeFileSync(file, text, "utf8");
  return { path: file, text };
}

export function registerReport(program: Command): void {
  program
    .command("report")
    .description("Render a report from a template (board-update | baseline | monthly).")
    .requiredOption("--type <type>", "board-update | baseline | monthly")
    .action((options: { type: string }) => {
      const { path } = runReport({ type: options.type });
      process.stdout.write(`Wrote ${path}\n`);
    });
}
