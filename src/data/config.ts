import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import type { Config } from "../core/types.js";
import { runboardPaths } from "./paths.js";

export function defaultConfig(rubricVersion: string): Config {
  return { org: "", rubricVersion };
}

export function readConfig(root: string = process.cwd()): Config {
  const text = readFileSync(runboardPaths(root).config, "utf8");
  const raw = (parse(text) ?? {}) as Record<string, unknown>;
  return {
    org: typeof raw.org === "string" ? raw.org : "",
    cadence: typeof raw.cadence === "string" ? raw.cadence : undefined,
    rubricVersion: typeof raw.rubricVersion === "string" ? raw.rubricVersion : "",
  };
}

export function writeConfig(config: Config, root: string = process.cwd()): void {
  writeFileSync(runboardPaths(root).config, stringify(config), "utf8");
}
