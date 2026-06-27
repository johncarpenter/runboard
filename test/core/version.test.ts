import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VERSION } from "../../src/version.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(here, "../../package.json"), "utf8")) as {
  version: string;
};

describe("version single source", () => {
  it("matches package.json", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("is a non-empty semver-ish string", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
