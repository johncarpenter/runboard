import { cpSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BundledSkill, DetectedAgentDir } from "../core/skills.js";

// The shipped skills live at <package>/skills/. Mirrors shippedRubricPath() so it
// resolves from both the bundled dist/ layout and the src/ layout under test.
export function shippedSkillsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [path.resolve(here, "../skills"), path.resolve(here, "../../skills")];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // try next
    }
  }
  return candidates[candidates.length - 1] as string;
}

// A bundled skill is any immediate subdirectory containing a SKILL.md. The set is
// discovered, never hard-coded, so new skills install with no command change.
export function listBundledSkills(dir: string = shippedSkillsDir()): BundledSkill[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .map((name) => ({ name, sourceDir: path.join(dir, name) }))
    .filter((skill) => isDirectory(skill.sourceDir))
    .filter((skill) => isFile(path.join(skill.sourceDir, "SKILL.md")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Known agent skills locations. Add a row to serve more agents — the command surface
// does not change. v1: Claude Code, detected by the presence of a .claude/ dir.
const AGENT_TABLE: ReadonlyArray<{ agent: string; marker: string; skillsDir: string }> = [
  { agent: "claude-code", marker: ".claude", skillsDir: ".claude/skills" },
];

export function detectAgentDirs(cwd: string = process.cwd()): DetectedAgentDir[] {
  return AGENT_TABLE.filter((row) => isDirectory(path.join(cwd, row.marker))).map((row) => ({
    agent: row.agent,
    dir: path.join(cwd, row.skillsDir),
  }));
}

// Lists the skill folder names already present at a destination.
export function existingSkillNames(destination: string): string[] {
  try {
    return readdirSync(destination, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

// Copies a skill folder (SKILL.md + any siblings) into destDir/<skill>, overwriting.
export function copySkill(sourceDir: string, destDir: string): void {
  const target = path.join(destDir, path.basename(sourceDir));
  cpSync(sourceDir, target, { recursive: true, force: true });
}

function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}
