import { existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseSetEntry, runAssess, today } from "../../src/commands/assess.js";
import { UserError } from "../../src/commands/shared.js";
import { loadAssessment } from "../../src/data/assessments.js";
import { assessmentFile } from "../../src/data/paths.js";
import { cleanup, initRepo, makeRepo, setFlags } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("today", () => {
  it("returns the local calendar date as YYYY-MM-DD", () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(today()).toBe(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  });
});

describe("parseSetEntry", () => {
  it("parses dim=level:traj:evidence", () => {
    expect(parseSetEntry("build.team=2:flat:All devs contracted")).toEqual({
      key: "build.team",
      value: { level: 2, trajectory: "flat", evidence: "All devs contracted" },
    });
  });

  it("strips surrounding quotes from evidence", () => {
    expect(parseSetEntry('run.tools=3:up:"Monitoring extended"').value).toMatchObject({
      evidence: "Monitoring extended",
    });
  });

  it("rejects malformed entries", () => {
    expect(() => parseSetEntry("build.team=2")).toThrow(UserError);
  });
});

describe("assess (non-interactive)", () => {
  it("writes a dated assessment from --set flags", () => {
    const { date } = runAssess({ root, sets: setFlags(3, "up"), date: "2026-06-27" });
    expect(date).toBe("2026-06-27");
    expect(existsSync(assessmentFile(root, "2026-06-27"))).toBe(true);
    const loaded = loadAssessment("2026-06-27", root);
    expect(loaded.scores["build.team"].level).toBe(3);
    expect(loaded.scores["build.team"].trajectory).toBe("up");
  });

  it("rejects an invalid value naming the dimension", () => {
    const bad = setFlags().map((f) => (f.startsWith("plan.tools") ? "plan.tools=9:up:x" : f));
    expect(() => runAssess({ root, sets: bad, date: "2026-06-27" })).toThrow(/plan.tools/);
  });

  it("rejects a missing dimension naming it", () => {
    const partial = setFlags().filter((f) => !f.startsWith("run.team"));
    expect(() => runAssess({ root, sets: partial, date: "2026-06-27" })).toThrow(/run.team/);
  });

  it("rejects an invalid --type instead of silently defaulting", () => {
    expect(() =>
      runAssess({ root, sets: setFlags(), type: "basline", date: "2026-06-27" }),
    ).toThrow(/Invalid --type/);
  });

  it("refuses to overwrite the same day without --force", () => {
    runAssess({ root, sets: setFlags(), date: "2026-06-27" });
    expect(() => runAssess({ root, sets: setFlags(), date: "2026-06-27" })).toThrow(
      /already exists/,
    );
    expect(() =>
      runAssess({ root, sets: setFlags(4), date: "2026-06-27", force: true }),
    ).not.toThrow();
  });

  it("requires init first", () => {
    const fresh = makeRepo();
    expect(() => runAssess({ root: fresh, sets: setFlags(), date: "2026-06-27" })).toThrow(
      /runboard init/,
    );
    cleanup(fresh);
  });
});
