import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runBoard } from "../../src/commands/board.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("board --html", () => {
  it("writes a self-contained html file with no external assets", () => {
    seed(root, "2026-06-27", { base: 3 });
    const { htmlPath } = runBoard({ root, html: true });
    expect(htmlPath).toBeDefined();
    expect(existsSync(htmlPath as string)).toBe(true);

    const html = readFileSync(htmlPath as string, "utf8");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Biggest constraint");
    // No external assets / network references.
    expect(html).not.toMatch(/src=["']https?:/);
    expect(html).not.toMatch(/href=["']https?:/);
    expect(html).not.toContain("<script");
  });
});
