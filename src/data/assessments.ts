import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import {
  type Assessment,
  type AssessmentType,
  DIMENSION_KEYS,
  type DimensionKey,
  type DimensionScore,
  isAssessmentType,
  isLevel,
  isTrajectory,
} from "../core/types.js";
import { assessmentFile, runboardPaths } from "./paths.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class AssessmentError extends Error {}

// Validate a raw scores record, returning a typed, complete one or throwing by name.
export function validateScores(raw: unknown): Record<DimensionKey, DimensionScore> {
  if (!raw || typeof raw !== "object") {
    throw new AssessmentError("Assessment has no scores.");
  }
  const obj = raw as Record<string, unknown>;
  const result = {} as Record<DimensionKey, DimensionScore>;
  for (const key of DIMENSION_KEYS) {
    const cell = obj[key];
    if (!cell || typeof cell !== "object") {
      throw new AssessmentError(`Missing score for dimension "${key}".`);
    }
    const c = cell as Record<string, unknown>;
    const level = typeof c.level === "string" ? Number(c.level) : c.level;
    if (!isLevel(level)) {
      throw new AssessmentError(`Dimension "${key}" has an invalid level (must be 1-5).`);
    }
    if (!isTrajectory(c.trajectory)) {
      throw new AssessmentError(
        `Dimension "${key}" has an invalid trajectory (must be up/flat/down/volatile).`,
      );
    }
    result[key] = {
      level,
      trajectory: c.trajectory,
      evidence: typeof c.evidence === "string" ? c.evidence : "",
    };
  }
  return result;
}

export function serializeAssessment(a: Assessment): string {
  const frontmatter = stringify({
    date: a.date,
    type: a.type,
    scores: a.scores,
    ...(a.notes ? { notes: a.notes } : {}),
  });
  const body = a.narrative ? `\n${a.narrative.trim()}\n` : "";
  return `---\n${frontmatter}---\n${body}`;
}

export function parseAssessment(text: string, fallbackDate?: string): Assessment {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new AssessmentError("Assessment file is missing YAML frontmatter.");
  }
  const raw = (parse(match[1] as string) ?? {}) as Record<string, unknown>;
  const date = typeof raw.date === "string" ? raw.date : (fallbackDate ?? "");
  if (!DATE_RE.test(date)) {
    throw new AssessmentError(`Assessment has an invalid date: "${date}".`);
  }
  const type: AssessmentType = isAssessmentType(raw.type) ? raw.type : "baseline";
  const scores = validateScores(raw.scores);
  const narrative = (match[2] ?? "").trim();
  return {
    date,
    type,
    scores,
    ...(typeof raw.notes === "string" ? { notes: raw.notes } : {}),
    ...(narrative ? { narrative } : {}),
  };
}

export function listAssessmentDates(root: string = process.cwd()): string[] {
  const dir = runboardPaths(root).assessmentsDir;
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.basename(f, ".md"))
    .filter((d) => DATE_RE.test(d))
    .sort();
}

export function loadAssessment(date: string, root: string = process.cwd()): Assessment {
  const file = assessmentFile(root, date);
  return parseAssessment(readFileSync(file, "utf8"), date);
}

// Chronological order, oldest first.
export function loadAllAssessments(root: string = process.cwd()): Assessment[] {
  return listAssessmentDates(root).map((date) => loadAssessment(date, root));
}

export function latestAssessment(root: string = process.cwd()): Assessment | undefined {
  const dates = listAssessmentDates(root);
  const last = dates[dates.length - 1];
  return last ? loadAssessment(last, root) : undefined;
}

export interface SaveOptions {
  force?: boolean;
}

export function saveAssessment(
  a: Assessment,
  root: string = process.cwd(),
  options: SaveOptions = {},
): string {
  const dir = runboardPaths(root).assessmentsDir;
  mkdirSync(dir, { recursive: true });
  const file = assessmentFile(root, a.date);
  if (existsSync(file) && !options.force) {
    throw new AssessmentError(
      `An assessment for ${a.date} already exists. Re-run with --force to overwrite.`,
    );
  }
  writeFileSync(file, serializeAssessment(a), "utf8");
  return file;
}
