import { describe, expect, it } from "vitest";
import { type DetectedAgentDir, planInstall, selectTarget } from "../../src/core/skills.js";

describe("selectTarget", () => {
  const claude: DetectedAgentDir = { agent: "claude-code", dir: "/p/.claude/skills" };
  const cursor: DetectedAgentDir = { agent: "cursor", dir: "/p/.cursor/skills" };

  it("prefers an explicit target over any detection", () => {
    expect(selectTarget({ target: "/custom" }, [claude])).toEqual({
      kind: "explicit",
      dir: "/custom",
    });
  });

  it("uses the single detected agent dir when no target is given", () => {
    expect(selectTarget({}, [claude])).toEqual({
      kind: "detected",
      agent: "claude-code",
      dir: "/p/.claude/skills",
    });
  });

  it("returns none when nothing is detected and no target is given", () => {
    expect(selectTarget({}, [])).toEqual({ kind: "none" });
  });

  it("returns ambiguous when multiple agents are detected", () => {
    expect(selectTarget({}, [claude, cursor])).toEqual({
      kind: "ambiguous",
      dirs: [claude, cursor],
    });
  });
});

describe("planInstall", () => {
  const bundled = [{ name: "assess" }, { name: "pulse" }, { name: "roadmap" }];

  it("creates skills not already present", () => {
    const actions = planInstall(bundled, [], { force: false });
    expect(actions.map((a) => a.kind)).toEqual(["create", "create", "create"]);
  });

  it("skips existing skills without force and explains --force", () => {
    const actions = planInstall(bundled, ["assess"], { force: false });
    const assess = actions.find((a) => a.name === "assess");
    expect(assess?.kind).toBe("skip");
    expect(assess?.reason).toMatch(/--force/);
    expect(actions.find((a) => a.name === "pulse")?.kind).toBe("create");
  });

  it("overwrites existing skills when force is set", () => {
    const actions = planInstall(bundled, ["assess"], { force: true });
    expect(actions.find((a) => a.name === "assess")?.kind).toBe("overwrite");
  });

  it("is an idempotent no-op when all skills already exist without force", () => {
    const actions = planInstall(bundled, ["assess", "pulse", "roadmap"], { force: false });
    expect(actions.every((a) => a.kind === "skip")).toBe(true);
  });
});
