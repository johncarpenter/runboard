import { describe, expect, it } from "vitest";
import { loadRubric, parseRubric, shippedRubricPath } from "../../src/data/rubric.js";

const valid = `
version: "1.0.0"
dimensions:
${[
  "build.team",
  "build.tools",
  "build.techniques",
  "run.team",
  "run.tools",
  "run.techniques",
  "plan.team",
  "plan.tools",
  "plan.techniques",
]
  .map(
    (key) => `  - key: ${key}
    title: ${key}
    anchors: { 1: a, 2: b, 3: c, 4: d, 5: e }`,
  )
  .join("\n")}
`;

describe("parseRubric", () => {
  it("loads a complete 9-dimension rubric", () => {
    const rubric = parseRubric(valid);
    expect(rubric.dimensions).toHaveLength(9);
    expect(rubric.version).toBe("1.0.0");
  });

  it("rejects a missing dimension", () => {
    const broken = valid.replace(/ {2}- key: plan\.techniques[\s\S]*$/, "");
    expect(() => parseRubric(broken)).toThrow(/plan.techniques/);
  });

  it("rejects a missing anchor level", () => {
    const broken = valid.replace("{ 1: a, 2: b, 3: c, 4: d, 5: e }", "{ 1: a, 2: b, 3: c, 4: d }");
    expect(() => parseRubric(broken)).toThrow(/anchor text for level 5/);
  });

  it("rejects a missing version", () => {
    const broken = valid.replace('version: "1.0.0"', "");
    expect(() => parseRubric(broken)).toThrow(/version/);
  });
});

describe("shipped rubric", () => {
  it("the packaged rubric.yaml is valid", () => {
    const rubric = loadRubric(shippedRubricPath());
    expect(rubric.dimensions).toHaveLength(9);
  });
});
