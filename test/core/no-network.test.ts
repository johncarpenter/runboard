import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (full.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

// Principle II: local-first, no phone-home. The shipped product code must not pull in
// networking modules or call fetch.
const FORBIDDEN = [
  /from\s+["']node:(http|https|net|dns|tls|dgram)["']/,
  /require\(\s*["']node:(http|https|net|dns|tls|dgram)["']\s*\)/,
  /\bfetch\s*\(/,
  /new\s+WebSocket/,
  /XMLHttpRequest/,
];

describe("no network usage in shipped code", () => {
  const files = [
    ...sourceFiles(path.join(repoRoot, "src")),
    ...sourceFiles(path.join(repoRoot, "mcp")),
  ];

  it("scans a non-trivial number of files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const file of files) {
    it(`is network-free: ${path.relative(repoRoot, file)}`, () => {
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        expect(pattern.test(text), `${path.relative(repoRoot, file)} matches ${pattern}`).toBe(
          false,
        );
      }
    });
  }
});
