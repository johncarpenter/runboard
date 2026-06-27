import { describe, expect, it } from "vitest";
import {
  AREAS,
  DIMENSION_KEYS,
  LENSES,
  isDimensionKey,
  isLevel,
  isTrajectory,
  parseDimensionKey,
} from "../../src/core/types.js";

describe("dimension keys", () => {
  it("has exactly 9 keys (area × lens)", () => {
    expect(DIMENSION_KEYS).toHaveLength(9);
    expect(new Set(DIMENSION_KEYS).size).toBe(9);
  });

  it("covers every area×lens combination", () => {
    for (const area of AREAS) {
      for (const lens of LENSES) {
        expect(DIMENSION_KEYS).toContain(`${area}.${lens}`);
      }
    }
  });

  it("orders areas outer, lenses inner", () => {
    expect(DIMENSION_KEYS[0]).toBe("build.team");
    expect(DIMENSION_KEYS[3]).toBe("run.team");
    expect(DIMENSION_KEYS[8]).toBe("plan.techniques");
  });

  it("parses valid keys and rejects invalid ones", () => {
    expect(parseDimensionKey("build.team")).toEqual({ area: "build", lens: "team" });
    expect(() => parseDimensionKey("build.nope")).toThrow();
    expect(() => parseDimensionKey("nope.team")).toThrow();
  });
});

describe("guards", () => {
  it("isLevel accepts 1-5 only", () => {
    expect(isLevel(1)).toBe(true);
    expect(isLevel(5)).toBe(true);
    expect(isLevel(0)).toBe(false);
    expect(isLevel(6)).toBe(false);
    expect(isLevel("3")).toBe(false);
  });

  it("isTrajectory accepts the four values", () => {
    expect(isTrajectory("up")).toBe(true);
    expect(isTrajectory("sideways")).toBe(false);
  });

  it("isDimensionKey validates membership", () => {
    expect(isDimensionKey("plan.tools")).toBe(true);
    expect(isDimensionKey("plan.toolz")).toBe(false);
  });
});
