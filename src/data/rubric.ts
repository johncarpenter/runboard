import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  DIMENSION_KEYS,
  type Level,
  type Rubric,
  type RubricDimension,
  parseDimensionKey,
} from "../core/types.js";

// The shipped rubric lives at <package>/rubric/rubric.yaml.
export function shippedRubricPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // From dist/ (bundled) or src/data/ (tests) walk up to the package root.
  const candidates = [
    path.resolve(here, "../rubric/rubric.yaml"),
    path.resolve(here, "../../rubric/rubric.yaml"),
  ];
  for (const candidate of candidates) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  return candidates[candidates.length - 1] as string;
}

export function parseRubric(text: string): Rubric {
  const raw = parse(text) as unknown;
  if (!raw || typeof raw !== "object") {
    throw new Error("Rubric is empty or malformed.");
  }
  const obj = raw as Record<string, unknown>;
  const version = typeof obj.version === "string" ? obj.version : "";
  if (!version) {
    throw new Error("Rubric is missing a `version`.");
  }
  if (!Array.isArray(obj.dimensions)) {
    throw new Error("Rubric is missing a `dimensions` list.");
  }
  const dimensions = obj.dimensions.map(parseDimension);

  const keys = dimensions.map((d) => d.key);
  for (const required of DIMENSION_KEYS) {
    if (!keys.includes(required)) {
      throw new Error(`Rubric is missing dimension "${required}".`);
    }
  }
  if (keys.length !== DIMENSION_KEYS.length) {
    throw new Error(
      `Rubric must have exactly ${DIMENSION_KEYS.length} dimensions; found ${keys.length}.`,
    );
  }
  return { version, dimensions };
}

function parseDimension(raw: unknown): RubricDimension {
  if (!raw || typeof raw !== "object") {
    throw new Error("Rubric dimension is malformed.");
  }
  const obj = raw as Record<string, unknown>;
  const key = String(obj.key ?? "");
  const { area, lens } = parseDimensionKey(key); // throws on bad key
  const title = typeof obj.title === "string" ? obj.title : key;
  const anchorsRaw = obj.anchors;
  if (!anchorsRaw || typeof anchorsRaw !== "object") {
    throw new Error(`Dimension "${key}" is missing anchors.`);
  }
  const anchorsObj = anchorsRaw as Record<string, unknown>;
  const anchors = {} as Record<Level, string>;
  for (const level of [1, 2, 3, 4, 5] as Level[]) {
    const text = anchorsObj[String(level)];
    if (typeof text !== "string" || text.length === 0) {
      throw new Error(`Dimension "${key}" is missing anchor text for level ${level}.`);
    }
    anchors[level] = text;
  }
  return { key: key as RubricDimension["key"], area, lens, title, anchors };
}

export function loadRubric(filePath: string = shippedRubricPath()): Rubric {
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    throw new Error(`Could not read rubric at ${filePath}.`);
  }
  return parseRubric(text);
}
