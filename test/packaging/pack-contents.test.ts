import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
  bin: Record<string, string>;
  files: string[];
};

describe("publishable package contents", () => {
  // Durable, build-independent guarantees: the config that decides what ships.
  it("declares both the CLI and the MCP bin", () => {
    expect(pkg.bin.runboard).toBe("dist/cli.js");
    expect(pkg.bin["runboard-mcp"]).toBe("dist/mcp.js");
  });

  it("ships the dist directory (so dist/mcp.js is published)", () => {
    expect(pkg.files).toContain("dist");
  });

  it("npm pack would include dist/mcp.js when built", () => {
    const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const files: string[] = JSON.parse(out)[0].files.map((f: { path: string }) => f.path);
    // package.json is always present; dist/mcp.js is present once a build has run.
    expect(files).toContain("package.json");
    if (existsSync(path.join(repoRoot, "dist", "mcp.js"))) {
      expect(files).toContain("dist/mcp.js");
      expect(files).toContain("dist/cli.js");
    }
  });
});
