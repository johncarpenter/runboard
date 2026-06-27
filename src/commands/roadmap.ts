import { writeFileSync } from "node:fs";
import type { Command } from "commander";
import { latestAssessment, listAssessmentDates } from "../data/assessments.js";
import { runboardPaths } from "../data/paths.js";
import { loadRubric } from "../data/rubric.js";
import { buildRoadmap } from "../render/reports.js";
import { requireAssessments, requireInit } from "./shared.js";

export interface RoadmapOptions {
  root?: string;
}

export function runRoadmap(opts: RoadmapOptions = {}): { path: string; text: string } {
  const root = opts.root ?? process.cwd();
  requireInit(root);
  requireAssessments(listAssessmentDates(root));
  const assessment = latestAssessment(root);
  if (!assessment) throw new Error("unreachable");

  const rubric = loadRubric(runboardPaths(root).rubric);
  const { text } = buildRoadmap(assessment, rubric);
  const file = runboardPaths(root).roadmap;
  writeFileSync(file, text, "utf8");
  return { path: file, text };
}

export function registerRoadmap(program: Command): void {
  program
    .command("roadmap")
    .description("Generate a Now/Next/Later plan from your binding constraint.")
    .action(() => {
      const { path } = runRoadmap();
      process.stdout.write(`Wrote ${path}\n`);
    });
}
