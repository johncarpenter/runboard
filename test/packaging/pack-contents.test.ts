import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

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

  it("ships the skills directory (so `skills install` has something to copy)", () => {
    expect(pkg.files).toContain("skills");
  });

  describe("the packed tarball", () => {
    // The test suite runs before `build` in CI, so ensure the artifact exists first —
    // otherwise this assertion would silently pass on an unbuilt tree (FR-003).
    beforeAll(() => {
      if (!existsSync(path.join(repoRoot, "dist", "mcp.js"))) {
        execFileSync("npm", ["run", "build"], { cwd: repoRoot, stdio: "ignore" });
      }
    }, 120_000);

    it("includes both built bin entries", () => {
      const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
        cwd: repoRoot,
        encoding: "utf8",
      });
      const files: string[] = JSON.parse(out)[0].files.map((f: { path: string }) => f.path);
      expect(files).toContain("dist/mcp.js");
      expect(files).toContain("dist/cli.js");
      expect(files).toContain("package.json");
    });

    it("includes the bundled skills and their SKILL.md files", () => {
      const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
        cwd: repoRoot,
        encoding: "utf8",
      });
      const files: string[] = JSON.parse(out)[0].files.map((f: { path: string }) => f.path);
      const skillManifests = files.filter(
        (f) => f.startsWith("skills/") && f.endsWith("/SKILL.md"),
      );
      expect(skillManifests.length).toBeGreaterThan(0);
    });
  });
});
