import { type Assessment, DIMENSION_KEYS, type DimensionKey, type Trajectory } from "./types.js";

export interface DimensionDelta {
  key: DimensionKey;
  from: number;
  to: number;
  change: number;
  trajectoryFrom: Trajectory;
  trajectoryTo: Trajectory;
}

// Per-dimension change from the older to the newer assessment.
export function computeDeltas(previous: Assessment, current: Assessment): DimensionDelta[] {
  return DIMENSION_KEYS.map((key) => {
    const from = previous.scores[key];
    const to = current.scores[key];
    return {
      key,
      from: from.level,
      to: to.level,
      change: to.level - from.level,
      trajectoryFrom: from.trajectory,
      trajectoryTo: to.trajectory,
    };
  });
}
