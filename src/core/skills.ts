// Pure planning logic for `skills install`. No I/O — every function here is
// deterministic and unit-tested (Constitution I). The command layer performs the
// filesystem work around these decisions.

export interface BundledSkill {
  name: string;
  sourceDir: string;
}

export interface DetectedAgentDir {
  agent: string;
  dir: string;
}

export type TargetResolution =
  | { kind: "explicit"; dir: string }
  | { kind: "detected"; agent: string; dir: string }
  | { kind: "none" }
  | { kind: "ambiguous"; dirs: DetectedAgentDir[] };

export type SkillActionKind = "create" | "overwrite" | "skip";

export interface SkillAction {
  name: string;
  kind: SkillActionKind;
  reason?: string;
}

// Precedence: explicit --target wins; else exactly one detected dir; else none/ambiguous.
export function selectTarget(
  options: { target?: string },
  detected: DetectedAgentDir[],
): TargetResolution {
  if (options.target) {
    return { kind: "explicit", dir: options.target };
  }
  if (detected.length === 0) {
    return { kind: "none" };
  }
  if (detected.length === 1) {
    const only = detected[0] as DetectedAgentDir;
    return { kind: "detected", agent: only.agent, dir: only.dir };
  }
  return { kind: "ambiguous", dirs: detected };
}

// One action per bundled skill. Never overwrites without force — "no silent clobber".
export function planInstall(
  bundled: ReadonlyArray<{ name: string }>,
  existingNames: ReadonlyArray<string>,
  options: { force: boolean },
): SkillAction[] {
  const existing = new Set(existingNames);
  return bundled.map((skill) => {
    if (!existing.has(skill.name)) {
      return { name: skill.name, kind: "create" };
    }
    if (options.force) {
      return { name: skill.name, kind: "overwrite" };
    }
    return {
      name: skill.name,
      kind: "skip",
      reason: "already present (use --force to overwrite)",
    };
  });
}
