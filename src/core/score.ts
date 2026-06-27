import {
  type Assessment,
  DIMENSION_KEYS,
  type DimensionKey,
  type Level,
  TRAJECTORIES,
  type Trajectory,
} from "./types.js";

export interface BoardCell {
  key: DimensionKey;
  level: Level;
  trajectory: Trajectory;
}

export interface BoardSummary {
  cells: BoardCell[];
  average: number; // exact mean of the 9 levels
  trajectoryCounts: Record<Trajectory, number>;
}

export function summarise(assessment: Assessment): BoardSummary {
  const cells: BoardCell[] = DIMENSION_KEYS.map((key) => {
    const score = assessment.scores[key];
    return { key, level: score.level, trajectory: score.trajectory };
  });

  const total = cells.reduce((sum, cell) => sum + cell.level, 0);
  const average = total / cells.length;

  const trajectoryCounts = Object.fromEntries(TRAJECTORIES.map((t) => [t, 0])) as Record<
    Trajectory,
    number
  >;
  for (const cell of cells) {
    trajectoryCounts[cell.trajectory] += 1;
  }

  return { cells, average, trajectoryCounts };
}

export function formatAverage(average: number): string {
  return average.toFixed(1);
}
