import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInit } from "../../src/commands/init.js";
import { runboardPaths } from "../../src/data/paths.js";
import { cleanup, makeRepo } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeRepo();
});
afterEach(() => cleanup(root));

describe("init", () => {
  it("scaffolds config, rubric, and assessments/", () => {
    runInit(root);
    const p = runboardPaths(root);
    expect(existsSync(p.dir)).toBe(true);
    expect(existsSync(p.config)).toBe(true);
    expect(existsSync(p.rubric)).toBe(true);
    expect(existsSync(p.assessmentsDir)).toBe(true);
  });

  it("is idempotent and does not clobber existing data", () => {
    runInit(root);
    const assessment = path.join(runboardPaths(root).assessmentsDir, "2026-06-27.md");
    writeFileSync(assessment, "user data", "utf8");
    const created = runInit(root);
    expect(created).toEqual([]);
    expect(readFileSync(assessment, "utf8")).toBe("user data");
  });
});
