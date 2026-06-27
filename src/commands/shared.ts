import { existsSync } from "node:fs";
import { UserError } from "../core/errors.js";
import { runboardPaths } from "../data/paths.js";

export { UserError };

export function requireInit(root: string = process.cwd()): void {
  if (!existsSync(runboardPaths(root).dir)) {
    throw new UserError("No .runboard/ found here. Run `runboard init` first.");
  }
}

export function requireAssessments(dates: string[]): void {
  if (dates.length === 0) {
    throw new UserError("No assessments yet. Run `runboard assess` to record one.");
  }
}
