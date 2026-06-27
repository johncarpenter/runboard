// Deterministic core domain types. Pure data shapes — no I/O here.

export const AREAS = ["build", "run", "plan"] as const;
export type Area = (typeof AREAS)[number];

export const LENSES = ["team", "tools", "techniques"] as const;
export type Lens = (typeof LENSES)[number];

export const TRAJECTORIES = ["up", "flat", "down", "volatile"] as const;
export type Trajectory = (typeof TRAJECTORIES)[number];

export const ASSESSMENT_TYPES = ["baseline", "pulse", "quarterly", "event"] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export type Level = 1 | 2 | 3 | 4 | 5;

export type DimensionKey = `${Area}.${Lens}`;

// Canonical ordering: areas outer (build, run, plan), lenses inner (team, tools, techniques).
export const DIMENSION_KEYS: DimensionKey[] = AREAS.flatMap((area) =>
  LENSES.map((lens) => `${area}.${lens}` as DimensionKey),
);

export const TRAJECTORY_GLYPHS: Record<Trajectory, string> = {
  up: "⬆",
  flat: "➡",
  down: "⬇",
  volatile: "⚠",
};

export const LEVEL_LABELS: Record<Level, string> = {
  1: "Ad-hoc",
  2: "Repeatable",
  3: "Defined",
  4: "Measured",
  5: "Optimising",
};

export interface DimensionScore {
  level: Level;
  trajectory: Trajectory;
  evidence: string;
}

export interface Assessment {
  date: string; // YYYY-MM-DD
  type: AssessmentType;
  scores: Record<DimensionKey, DimensionScore>;
  notes?: string;
  narrative?: string;
}

export interface RubricDimension {
  key: DimensionKey;
  area: Area;
  lens: Lens;
  title: string;
  anchors: Record<Level, string>;
}

export interface Rubric {
  version: string;
  dimensions: RubricDimension[];
}

export interface Config {
  org: string;
  cadence?: string;
  rubricVersion: string;
}

export function parseDimensionKey(key: string): { area: Area; lens: Lens } {
  const [area, lens] = key.split(".");
  if (!isArea(area) || !isLens(lens)) {
    throw new Error(`Invalid dimension key: "${key}"`);
  }
  return { area, lens };
}

export function isArea(value: unknown): value is Area {
  return typeof value === "string" && (AREAS as readonly string[]).includes(value);
}

export function isLens(value: unknown): value is Lens {
  return typeof value === "string" && (LENSES as readonly string[]).includes(value);
}

export function isTrajectory(value: unknown): value is Trajectory {
  return typeof value === "string" && (TRAJECTORIES as readonly string[]).includes(value);
}

export function isAssessmentType(value: unknown): value is AssessmentType {
  return typeof value === "string" && (ASSESSMENT_TYPES as readonly string[]).includes(value);
}

export function isLevel(value: unknown): value is Level {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function isDimensionKey(value: unknown): value is DimensionKey {
  return typeof value === "string" && (DIMENSION_KEYS as string[]).includes(value);
}
