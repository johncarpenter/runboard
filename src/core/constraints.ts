import { type Assessment, DIMENSION_KEYS, type DimensionKey, type Trajectory } from "./types.js";

// Worse trajectory sorts first (more binding). Lower rank = more urgent.
const TRAJECTORY_RANK: Record<Trajectory, number> = {
  down: 0,
  volatile: 1,
  flat: 2,
  up: 3,
};

export interface RankedDimension {
  key: DimensionKey;
  level: number;
  trajectory: Trajectory;
}

// Dimensions ordered most-binding first: lowest level, then worse trajectory, then the
// canonical DIMENSION_KEYS order as a deterministic final tiebreak.
export function rankConstraints(assessment: Assessment): RankedDimension[] {
  return DIMENSION_KEYS.map((key) => ({
    key,
    level: assessment.scores[key].level,
    trajectory: assessment.scores[key].trajectory,
  })).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    const ta = TRAJECTORY_RANK[a.trajectory];
    const tb = TRAJECTORY_RANK[b.trajectory];
    if (ta !== tb) return ta - tb;
    return DIMENSION_KEYS.indexOf(a.key) - DIMENSION_KEYS.indexOf(b.key);
  });
}

export function bindingConstraint(assessment: Assessment): RankedDimension {
  return rankConstraints(assessment)[0] as RankedDimension;
}
