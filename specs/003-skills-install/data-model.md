# Phase 1 Data Model: Skills Install Command

This feature moves files; it has no persisted schema. The "entities" below are the in-memory types that flow through the pure planner (`src/core/skills.ts`) and the I/O layer (`src/data/skills.ts`). Types are illustrative TypeScript.

## Entities

### BundledSkill

A skill folder shipped inside the package.

```ts
interface BundledSkill {
  name: string;       // folder name, e.g. "assess"
  sourceDir: string;  // absolute path to the bundled skill folder
}
```

- `name` is unique within the bundled set.
- Derived by `listBundledSkills()` from `shippedSkillsDir()`; a folder qualifies only if it contains `SKILL.md`.

### InstallOptions

The user's resolved choices from CLI flags.

```ts
interface InstallOptions {
  target?: string;   // explicit --target dir (absolute or cwd-relative); undefined → auto-detect
  force: boolean;    // --force: overwrite existing destination skills
  dryRun: boolean;   // --dry-run: compute & report, write nothing
}
```

### DetectedAgentDir

Result of probing the project for known agent skills locations (I/O layer output).

```ts
interface DetectedAgentDir {
  agent: string;     // e.g. "claude-code"
  dir: string;       // absolute path to the agent's skills dir, e.g. <cwd>/.claude/skills
}
```

- v1 detector table: `[{ agent: "claude-code", relativeDir: ".claude/skills" }]`.
- A probe returns only the entries whose `dir` already exists as a directory.

### TargetResolution (pure)

Output of `selectTarget(options, detected)` — the decision, with no I/O.

```ts
type TargetResolution =
  | { kind: "explicit"; dir: string }          // --target supplied
  | { kind: "detected"; agent: string; dir: string } // exactly one agent dir found
  | { kind: "none" }                            // nothing supplied or detected → error w/ guidance
  | { kind: "ambiguous"; dirs: DetectedAgentDir[] }; // >1 detected → require --target
```

**Precedence rule** (tested):
1. `options.target` present → `explicit`.
2. else exactly one `detected` entry → `detected`.
3. else zero detected → `none`.
4. else (≥2 detected) → `ambiguous`.

### SkillAction (pure)

Per-skill outcome computed by `planInstall(bundled, existingNames, { force })`.

```ts
type SkillActionKind = "create" | "overwrite" | "skip";

interface SkillAction {
  name: string;
  kind: SkillActionKind;
  reason?: string;   // e.g. "already present (use --force to overwrite)"
}
```

**Decision rule** (tested):
- name ∉ existing → `create`.
- name ∈ existing and `force` → `overwrite`.
- name ∈ existing and not `force` → `skip` (reason explains `--force`).

### InstallPlan (pure)

```ts
interface InstallPlan {
  destination: string;       // resolved target dir
  actions: SkillAction[];    // one per bundled skill
}
```

- A plan with every action `skip` and no `create`/`overwrite` is a valid no-op (idempotent re-run).

### InstallReport (post-I/O)

What the command prints and tests assert on.

```ts
interface InstallReport {
  destination: string;
  installed: string[];   // create + overwrite that succeeded
  skipped: string[];     // skip actions
  failed?: { name: string; error: string }[]; // any copy that threw
}
```

## Validation rules

- **Target must be a directory** (or non-existent and creatable): if the resolved `destination` path exists and is a file → `UserError` (FR maps to non-zero exit).
- **Bundled source must be present and non-empty**: if `listBundledSkills()` returns `[]` → error (corrupt/partial package install).
- **No network**: none of these types or functions perform or require any network access.

## Layer ownership (Constitution I/III)

| Concern | Function | Layer | Pure? |
|---------|----------|-------|-------|
| Find bundled skills dir | `shippedSkillsDir()` | data | no (fs) |
| List bundled skills | `listBundledSkills()` | data | no (fs) |
| Probe agent dirs | `detectAgentDirs(cwd)` | data | no (fs) |
| Choose target | `selectTarget(opts, detected)` | core | **yes** |
| Plan per-skill actions | `planInstall(bundled, existing, opts)` | core | **yes** |
| Copy a skill folder | `copySkill(src, destDir)` | data | no (fs) |
| Orchestrate + report | `runSkillsInstall()` / `registerSkills()` | commands | no |
