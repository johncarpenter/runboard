import path from "node:path";

// Resolves the .runboard/ layout for a given project root (defaults to cwd).
export interface RunboardPaths {
  root: string;
  dir: string;
  config: string;
  rubric: string;
  assessmentsDir: string;
  reportsDir: string;
  roadmap: string;
  boardHtml: string;
}

export function runboardPaths(root: string = process.cwd()): RunboardPaths {
  const dir = path.join(root, ".runboard");
  return {
    root,
    dir,
    config: path.join(dir, "config.yaml"),
    rubric: path.join(dir, "rubric.yaml"),
    assessmentsDir: path.join(dir, "assessments"),
    reportsDir: path.join(dir, "reports"),
    roadmap: path.join(dir, "roadmap.md"),
    boardHtml: path.join(dir, "board.html"),
  };
}

export function assessmentFile(root: string, date: string): string {
  return path.join(runboardPaths(root).assessmentsDir, `${date}.md`);
}
