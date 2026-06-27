import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { type SkillAction, planInstall, selectTarget } from "../core/skills.js";
import {
  copySkill,
  detectAgentDirs,
  existingSkillNames,
  listBundledSkills,
} from "../data/skills.js";
import { UserError } from "./shared.js";

export interface SkillsInstallOptions {
  root?: string;
  target?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface InstallReport {
  destination: string;
  dryRun: boolean;
  installed: string[];
  skipped: string[];
  actions: SkillAction[];
}

export function runSkillsInstall(opts: SkillsInstallOptions = {}): InstallReport {
  const root = opts.root ?? process.cwd();
  const force = opts.force ?? false;
  const dryRun = opts.dryRun ?? false;

  const bundled = listBundledSkills();
  if (bundled.length === 0) {
    throw new UserError(
      "No bundled skills found in this runboard install. The package may be corrupt; try reinstalling.",
    );
  }

  const destination = resolveDestination(root, opts.target);

  if (existsSync(destination) && !statSync(destination).isDirectory()) {
    throw new UserError(`Target ${destination} is a file, not a directory.`);
  }

  const actions = planInstall(bundled, existingSkillNames(destination), { force });

  const installed: string[] = [];
  const skipped: string[] = [];

  if (!dryRun) {
    mkdirSync(destination, { recursive: true });
  }

  for (const action of actions) {
    if (action.kind === "skip") {
      skipped.push(action.name);
      continue;
    }
    if (!dryRun) {
      const skill = bundled.find((b) => b.name === action.name);
      if (skill) {
        copySkill(skill.sourceDir, destination);
      }
    }
    installed.push(action.name);
  }

  return { destination, dryRun, installed, skipped, actions };
}

function resolveDestination(root: string, target?: string): string {
  const resolution = selectTarget(
    { target: target ? path.resolve(root, target) : undefined },
    detectAgentDirs(root),
  );
  switch (resolution.kind) {
    case "explicit":
      return resolution.dir;
    case "detected":
      return resolution.dir;
    case "none":
      throw new UserError(
        "No agent skills directory detected. Re-run with --target <dir> (e.g. --target .cursor/skills).",
      );
    case "ambiguous":
      throw new UserError(
        `Multiple agent skills directories detected:\n${resolution.dirs
          .map((d) => `  ${d.agent}: ${d.dir}`)
          .join("\n")}\nRe-run with --target <dir> to choose one.`,
      );
  }
}

function formatReport(report: InstallReport): string {
  const lines: string[] = [];
  if (report.dryRun) {
    lines.push("Dry run — no files will be written.");
    lines.push(`Destination: ${report.destination}`);
    for (const action of report.actions) {
      const label = action.kind === "skip" ? "skip (already present)" : action.kind;
      lines.push(`  ${action.name.padEnd(14)}${label}`);
    }
    return `${lines.join("\n")}\n`;
  }

  lines.push(`Installing skills into ${report.destination}`);
  for (const action of report.actions) {
    if (action.kind === "skip") {
      lines.push(
        `  - ${action.name.padEnd(14)}(skipped: already present, use --force to overwrite)`,
      );
    } else {
      const verb = action.kind === "overwrite" ? "overwritten" : "created";
      lines.push(`  ✓ ${action.name.padEnd(14)}(${verb})`);
    }
  }
  lines.push("");
  lines.push(
    `Installed ${report.installed.length} skill(s), skipped ${report.skipped.length}. Restart your agent to pick them up.`,
  );
  return `${lines.join("\n")}\n`;
}

export function registerSkills(program: Command): void {
  const skills = program.command("skills").description("Manage runboard's portable AI skills.");

  skills
    .command("install")
    .description("Copy the bundled SKILL.md skills into an agent's skills directory.")
    .option("--target <dir>", "destination directory (overrides auto-detection)")
    .option("--force", "overwrite skills already present at the destination")
    .option("--dry-run", "show what would be installed without writing anything")
    .action((options: { target?: string; force?: boolean; dryRun?: boolean }) => {
      const report = runSkillsInstall({
        target: options.target,
        force: options.force,
        dryRun: options.dryRun,
      });
      process.stdout.write(formatReport(report));
    });
}
