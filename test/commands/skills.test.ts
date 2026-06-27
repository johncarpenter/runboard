import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserError } from "../../src/commands/shared.js";
import { runSkillsInstall } from "../../src/commands/skills.js";
import { listBundledSkills, shippedSkillsDir } from "../../src/data/skills.js";
import { cleanup, makeRepo } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeRepo();
});
afterEach(() => cleanup(root));

const bundledNames = () => listBundledSkills().map((s) => s.name);

describe("skills install — auto-detect (US1)", () => {
  it("installs every bundled skill into a detected .claude/skills dir", () => {
    mkdirSync(path.join(root, ".claude"), { recursive: true });
    const report = runSkillsInstall({ root });

    const dest = path.join(root, ".claude", "skills");
    expect(report.destination).toBe(dest);
    for (const name of bundledNames()) {
      expect(existsSync(path.join(dest, name, "SKILL.md"))).toBe(true);
    }
    expect(report.installed.sort()).toEqual(bundledNames().sort());
  });

  it("copies skills byte-faithfully from the bundled source", () => {
    mkdirSync(path.join(root, ".claude"), { recursive: true });
    runSkillsInstall({ root });
    const name = bundledNames()[0] as string;
    const installed = readFileSync(path.join(root, ".claude", "skills", name, "SKILL.md"), "utf8");
    const source = readFileSync(path.join(shippedSkillsDir(), name, "SKILL.md"), "utf8");
    expect(installed).toBe(source);
  });

  it("errors with guidance when nothing is detected and no target is given", () => {
    expect(() => runSkillsInstall({ root })).toThrow(UserError);
    expect(() => runSkillsInstall({ root })).toThrow(/--target/);
  });
});

describe("skills install — explicit target (US2)", () => {
  it("installs into an explicit --target, overriding detection", () => {
    mkdirSync(path.join(root, ".claude"), { recursive: true });
    const report = runSkillsInstall({ root, target: "custom/skills" });
    const dest = path.join(root, "custom", "skills");
    expect(report.destination).toBe(dest);
    expect(existsSync(path.join(dest, bundledNames()[0] as string, "SKILL.md"))).toBe(true);
  });

  it("creates a non-existent target directory", () => {
    const dest = path.join(root, "deep", "nested", "skills");
    expect(existsSync(dest)).toBe(false);
    runSkillsInstall({ root, target: "deep/nested/skills" });
    expect(existsSync(dest)).toBe(true);
  });

  it("rejects a target that is a file", () => {
    writeFileSync(path.join(root, "afile"), "x", "utf8");
    expect(() => runSkillsInstall({ root, target: "afile" })).toThrow(/not a directory/);
  });
});

describe("skills install — re-install safety and preview (US3)", () => {
  it("skips existing skills on re-run without --force (no silent clobber)", () => {
    const target = "out";
    runSkillsInstall({ root, target });
    const name = bundledNames()[0] as string;
    const file = path.join(root, "out", name, "SKILL.md");
    writeFileSync(file, "EDITED", "utf8");

    const report = runSkillsInstall({ root, target });
    expect(report.skipped).toContain(name);
    expect(readFileSync(file, "utf8")).toBe("EDITED");
  });

  it("overwrites existing skills with --force", () => {
    const target = "out";
    runSkillsInstall({ root, target });
    const name = bundledNames()[0] as string;
    const file = path.join(root, "out", name, "SKILL.md");
    writeFileSync(file, "EDITED", "utf8");

    const report = runSkillsInstall({ root, target, force: true });
    expect(report.installed).toContain(name);
    expect(readFileSync(file, "utf8")).not.toBe("EDITED");
  });

  it("writes nothing in --dry-run and does not mark anything installed", () => {
    const dest = path.join(root, "out");
    const report = runSkillsInstall({ root, target: "out", dryRun: true });
    expect(report.dryRun).toBe(true);
    expect(report.actions.every((a) => a.kind === "create")).toBe(true);
    expect(report.installed).toHaveLength(0);
    expect(existsSync(dest)).toBe(false);
  });

  it("records a copy failure instead of crashing, and excludes it from installed", () => {
    // A pre-existing *file* where a skill folder should go makes the recursive
    // directory copy fail for that one skill — a deterministic mid-run error.
    const name = bundledNames()[0] as string;
    const dest = path.join(root, "out");
    mkdirSync(dest, { recursive: true });
    writeFileSync(path.join(dest, name), "blocker", "utf8");

    const report = runSkillsInstall({ root, target: "out" });
    expect(report.failed.map((f) => f.name)).toContain(name);
    expect(report.installed).not.toContain(name);
    // The other skills still install.
    expect(report.installed.length).toBeGreaterThan(0);
  });
});
