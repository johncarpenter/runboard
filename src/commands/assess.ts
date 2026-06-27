import { cancel, intro, isCancel, note, outro, select, text } from "@clack/prompts";
import type { Command } from "commander";
import {
  type Assessment,
  type AssessmentType,
  DIMENSION_KEYS,
  type Level,
  TRAJECTORIES,
  type Trajectory,
  isAssessmentType,
} from "../core/types.js";
import { listAssessmentDates, saveAssessment, validateScores } from "../data/assessments.js";
import { runboardPaths } from "../data/paths.js";
import { loadRubric } from "../data/rubric.js";
import { UserError, requireInit } from "./shared.js";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Parse a `<dim>=<level>:<traj>:<evidence>` flag into a raw score entry.
export function parseSetEntry(entry: string): { key: string; value: unknown } {
  const eq = entry.indexOf("=");
  if (eq < 0)
    throw new UserError(`Invalid --set "${entry}". Expected <dim>=<level>:<traj>:<evidence>.`);
  const key = entry.slice(0, eq).trim();
  const rest = entry.slice(eq + 1);
  const c1 = rest.indexOf(":");
  const c2 = rest.indexOf(":", c1 + 1);
  if (c1 < 0 || c2 < 0) {
    throw new UserError(`Invalid --set "${entry}". Expected <dim>=<level>:<traj>:<evidence>.`);
  }
  const level = Number(rest.slice(0, c1).trim());
  const trajectory = rest.slice(c1 + 1, c2).trim();
  const evidence = rest
    .slice(c2 + 1)
    .trim()
    .replace(/^"(.*)"$/, "$1");
  return { key, value: { level, trajectory, evidence } };
}

export interface AssessOptions {
  root?: string;
  sets?: string[];
  type?: string;
  force?: boolean;
  date?: string;
}

function defaultType(root: string): AssessmentType {
  return listAssessmentDates(root).length === 0 ? "baseline" : "pulse";
}

// Non-interactive path (used by the CLI --set flow and by tests / agents).
export function runAssess(opts: AssessOptions): { date: string; path: string } {
  const root = opts.root ?? process.cwd();
  requireInit(root);
  const date = opts.date ?? today();
  const type = opts.type ?? defaultType(root);
  if (!isAssessmentType(type)) {
    throw new UserError(`Invalid --type "${type}". Use baseline, pulse, quarterly, or event.`);
  }

  const raw: Record<string, unknown> = {};
  for (const entry of opts.sets ?? []) {
    const { key, value } = parseSetEntry(entry);
    raw[key] = value;
  }
  const scores = validateScores(raw); // throws by dimension name on any problem
  const assessment: Assessment = { date, type, scores };
  const path = saveAssessment(assessment, root, { force: opts.force });
  return { date, path };
}

async function runInteractive(opts: AssessOptions): Promise<{ date: string; path: string }> {
  const root = opts.root ?? process.cwd();
  requireInit(root);
  const date = opts.date ?? today();
  const rubric = loadRubric(runboardPaths(root).rubric);

  intro("Runboard assessment");
  const raw: Record<string, unknown> = {};

  for (const key of DIMENSION_KEYS) {
    const dim = rubric.dimensions.find((d) => d.key === key);
    if (!dim) continue;
    note(([1, 2, 3, 4, 5] as Level[]).map((l) => `${l}  ${dim.anchors[l]}`).join("\n"), dim.title);

    const level = await select({
      message: `${dim.title} — level?`,
      options: ([1, 2, 3, 4, 5] as Level[]).map((l) => ({ value: l, label: `${l}` })),
    });
    if (isCancel(level)) return abort();

    const trajectory = await select({
      message: "Trajectory?",
      options: TRAJECTORIES.map((t) => ({ value: t, label: t })),
    });
    if (isCancel(trajectory)) return abort();

    const evidence = await text({ message: "One-line evidence (optional)", defaultValue: "" });
    if (isCancel(evidence)) return abort();

    raw[key] = { level: level as Level, trajectory: trajectory as Trajectory, evidence };
  }

  const scores = validateScores(raw);
  const type = opts.type && isAssessmentType(opts.type) ? opts.type : defaultType(root);
  const path = saveAssessment({ date, type, scores }, root, { force: opts.force });
  outro(`Saved ${path}. Run \`runboard board\` to see your scorecard.`);
  return { date, path };
}

function abort(): never {
  cancel("Assessment cancelled.");
  throw new UserError("Assessment cancelled.");
}

export function registerAssess(program: Command): void {
  program
    .command("assess")
    .description("Record a 9-dimension assessment (interactive, or --set for agents).")
    .option("--type <type>", "baseline | pulse | quarterly | event")
    .option(
      "--set <entry>",
      "non-interactive: <dim>=<level>:<traj>:<evidence> (repeatable)",
      (val: string, prev: string[] = []) => [...prev, val],
      [] as string[],
    )
    .option("--force", "overwrite an existing assessment for today")
    .action(async (options: { type?: string; set?: string[]; force?: boolean }) => {
      const sets = options.set ?? [];
      if (sets.length > 0) {
        const { path } = runAssess({ sets, type: options.type, force: options.force });
        process.stdout.write(`Saved ${path}. Run \`runboard board\` to see your scorecard.\n`);
      } else {
        await runInteractive({ type: options.type, force: options.force });
      }
    });
}
