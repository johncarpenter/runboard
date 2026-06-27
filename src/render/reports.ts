import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";
import { UserError } from "../commands/shared.js";
import { bindingConstraint, rankConstraints } from "../core/constraints.js";
import { computeDeltas } from "../core/delta.js";
import { formatAverage, summarise } from "../core/score.js";
import { detectTriggers } from "../core/triggers.js";
import {
  AREAS,
  type Area,
  type Assessment,
  DIMENSION_KEYS,
  type DimensionKey,
  type Rubric,
} from "../core/types.js";

export const NOW_LIMIT = 3;
export const NEXT_LIMIT = 5;

function templatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [path.resolve(here, "../templates"), path.resolve(here, "../../templates")];
  for (const candidate of candidates) {
    try {
      readFileSync(path.join(candidate, "roadmap.eta"));
      return candidate;
    } catch {
      // try next
    }
  }
  return candidates[candidates.length - 1] as string;
}

function eta(): Eta {
  return new Eta({ views: templatesDir(), autoTrim: false });
}

function title(rubric: Rubric, key: DimensionKey): string {
  return rubric.dimensions.find((d) => d.key === key)?.title ?? key;
}

// Business-outcome phrasing for each dimension's improvement goal.
const OUTCOMES: Record<DimensionKey, string> = {
  "build.team":
    "Build retained engineering capability so delivery no longer depends on individuals.",
  "build.tools": "Make builds and environments reproducible so releases are predictable.",
  "build.techniques": "Establish a consistent delivery cadence so output is reliable.",
  "run.team": "Put clear production ownership in place so incidents are handled, not improvised.",
  "run.tools": "Extend monitoring so problems are caught before customers feel them.",
  "run.techniques": "Adopt a defined incident process so outages shrink and don't recur.",
  "plan.team": "Strengthen leadership–business alignment so engineering is trusted and heard.",
  "plan.tools": "Maintain a live roadmap so priorities are visible and defensible.",
  "plan.techniques": "Set a clear strategy and prioritisation method so investment follows value.",
};

function areaAverage(assessment: Assessment, area: Area): number {
  const levels = DIMENSION_KEYS.filter((k) => k.startsWith(`${area}.`)).map(
    (k) => assessment.scores[k].level,
  );
  return levels.reduce((s, l) => s + l, 0) / levels.length;
}

export interface RoadmapResult {
  text: string;
  now: string[];
  next: string[];
  later: string[];
}

export function buildRoadmap(assessment: Assessment, rubric: Rubric): RoadmapResult {
  const ranked = rankConstraints(assessment);
  const belowTarget = ranked.filter((r) => r.level < 3);
  const nowRanked = (belowTarget.length ? belowTarget : ranked.slice(0, 1)).slice(0, NOW_LIMIT);
  const nowKeys = new Set(nowRanked.map((r) => r.key));
  const remaining = ranked.filter((r) => !nowKeys.has(r.key));
  const nextRanked = remaining.filter((r) => r.level <= 3).slice(0, NEXT_LIMIT);
  const nextKeys = new Set(nextRanked.map((r) => r.key));
  const laterRanked = remaining.filter((r) => !nextKeys.has(r.key));

  const now = nowRanked.map((r) => OUTCOMES[r.key]);
  const next = nextRanked.map((r) => OUTCOMES[r.key]);
  const later = laterRanked.map(
    (r) => `Sustain ${title(rubric, r.key)} (already at level ${r.level}).`,
  );

  const constraint = bindingConstraint(assessment);
  const text = eta().render("roadmap", {
    date: assessment.date,
    constraint: { ...constraint, title: title(rubric, constraint.key) },
    now,
    next,
    later,
  });
  return { text, now, next, later };
}

export function buildPulse(
  previous: Assessment,
  current: Assessment,
  history: Assessment[],
): string {
  const deltas = computeDeltas(previous, current);
  const triggers = detectTriggers(history);
  const improved = deltas.filter((d) => d.change > 0).map((d) => d.key);
  const regressed = deltas.filter((d) => d.change < 0).map((d) => d.key);
  return eta().render("pulse", {
    date: current.date,
    prevDate: previous.date,
    average: formatAverage(summarise(current).average),
    prevAverage: formatAverage(summarise(previous).average),
    deltas,
    triggers,
    improved,
    regressed,
  });
}

export type ReportType = "board-update" | "baseline" | "monthly";

export function buildReport(
  type: string,
  assessment: Assessment,
  rubric: Rubric,
  history: Assessment[],
): string {
  const summary = summarise(assessment);
  const average = formatAverage(summary.average);
  const constraint = bindingConstraint(assessment);
  const roadmap = buildRoadmap(assessment, rubric);

  if (type === "board-update") {
    return eta().render("board-update", {
      date: assessment.date,
      average,
      headline:
        summary.average >= 3
          ? "We are at or above our target operating level."
          : "We are below our target operating level and investing to close the gap.",
      areas: AREAS.map((area) => ({
        title: area[0]?.toUpperCase() + area.slice(1),
        average: formatAverage(areaAverage(assessment, area)),
        comment: areaAverage(assessment, area) >= 3 ? "Operating reliably." : "Needs investment.",
      })),
      constraint: { ...constraint, title: title(rubric, constraint.key) },
      constraintBusiness: OUTCOMES[constraint.key],
      now: roadmap.now,
      triggers: detectTriggers(history).map((k) => title(rubric, k)),
    });
  }

  if (type === "baseline") {
    return eta().render("baseline", {
      date: assessment.date,
      average,
      rows: DIMENSION_KEYS.map((k) => ({
        title: title(rubric, k),
        level: assessment.scores[k].level,
        trajectory: assessment.scores[k].trajectory,
        evidence: assessment.scores[k].evidence,
      })),
      constraint: { ...constraint, title: title(rubric, constraint.key) },
    });
  }

  if (type === "monthly") {
    return eta().render("monthly", {
      date: assessment.date,
      average,
      areas: AREAS.map((area) => ({
        title: area[0]?.toUpperCase() + area.slice(1),
        average: formatAverage(areaAverage(assessment, area)),
      })),
      constraint: { ...constraint, title: title(rubric, constraint.key) },
    });
  }

  throw new UserError(`Unknown report type "${type}". Use board-update, baseline, or monthly.`);
}
