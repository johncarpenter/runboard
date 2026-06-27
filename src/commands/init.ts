import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import type { Command } from "commander";
import { stringify } from "yaml";
import { defaultConfig } from "../data/config.js";
import { runboardPaths } from "../data/paths.js";
import { loadRubric, shippedRubricPath } from "../data/rubric.js";

export function runInit(root: string = process.cwd()): string[] {
  const paths = runboardPaths(root);
  const created: string[] = [];

  if (!existsSync(paths.dir)) {
    mkdirSync(paths.dir, { recursive: true });
    created.push(".runboard/");
  }
  if (!existsSync(paths.assessmentsDir)) {
    mkdirSync(paths.assessmentsDir, { recursive: true });
    created.push(".runboard/assessments/");
  }
  if (!existsSync(paths.rubric)) {
    copyFileSync(shippedRubricPath(), paths.rubric);
    created.push(".runboard/rubric.yaml");
  }
  if (!existsSync(paths.config)) {
    const rubric = loadRubric(paths.rubric);
    writeFileSync(paths.config, stringify(defaultConfig(rubric.version)), "utf8");
    created.push(".runboard/config.yaml");
  }
  return created;
}

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("Scaffold .runboard/ in the current repo (idempotent).")
    .action(() => {
      const created = runInit();
      if (created.length === 0) {
        process.stdout.write("Runboard is already set up here. Nothing to do.\n");
      } else {
        process.stdout.write(`Created:\n${created.map((c) => `  ${c}`).join("\n")}\n`);
      }
      process.stdout.write("\nNext: run `runboard assess` to record your first assessment.\n");
    });
}
