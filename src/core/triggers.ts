import { type Assessment, DIMENSION_KEYS, type DimensionKey } from "./types.js";

// A dimension is auto-triggered when, across the three most recent assessments, its level
// never increased — i.e., both consecutive steps are flat or regressing (delta <= 0).
// Fewer than three assessments => no triggers.
export const TRIGGER_WINDOW = 3;

export function detectTriggers(assessmentsChrono: Assessment[]): DimensionKey[] {
  if (assessmentsChrono.length < TRIGGER_WINDOW) {
    return [];
  }
  const window = assessmentsChrono.slice(-TRIGGER_WINDOW);
  const triggered: DimensionKey[] = [];

  for (const key of DIMENSION_KEYS) {
    const levels = window.map((a) => a.scores[key].level);
    let stuck = true;
    for (let i = 1; i < levels.length; i++) {
      if ((levels[i] as number) > (levels[i - 1] as number)) {
        stuck = false;
        break;
      }
    }
    if (stuck) {
      triggered.push(key);
    }
  }
  return triggered;
}
