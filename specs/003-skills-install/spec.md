# Feature Specification: Skills Install Command

**Feature Branch**: `003-skills-install`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "The skills are already SKILL.md files bundled inside the npm package (skills/ is in package.json files), and SKILL.md is the cross-agent open format — so 'installing' really just means copying those folders to wherever a given agent looks for skills. The catch is there's no single universal location: Claude Code reads .claude/skills/, Cursor/Codex/others each have their own dir. The cleanest agent-agnostic move that fits your 'one source of truth' rule is a small CLI subcommand: `npx runboard@latest skills install [--target <dir>]`. It copies the bundled skills/*/SKILL.md into a target directory — defaulting to auto-detected agent dirs (.claude/skills/, etc.) or a plain --target you pass. Since the files ship in the package already, it's zero extra distribution, works via the same npx path users already know, and stays format-agnostic."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install skills into a detected agent (Priority: P1)

A technical leader has runboard available via npx and wants their AI coding agent (e.g. Claude Code) to be able to run the Runboard assessment skills. From their project, they run a single command and the bundled skills appear in the location their agent already reads, ready to use in their next conversation.

**Why this priority**: This is the core value of the feature — turning the already-bundled skills into something an agent can actually discover and run with zero manual copying or per-agent path knowledge. Without it, the skills ship but are effectively unreachable for most users.

**Independent Test**: From a project that contains a recognised agent directory (e.g. `.claude/`), run the install command with no target and confirm that each bundled skill folder now exists in that agent's skills location and matches the shipped source.

**Acceptance Scenarios**:

1. **Given** a project containing a recognised agent directory and no skills installed yet, **When** the user runs the install command without specifying a target, **Then** every bundled skill is copied into that agent's skills directory and the command reports which skills were installed and where.
2. **Given** a recognised agent directory already exists, **When** installation completes, **Then** each installed skill is a faithful copy of the shipped SKILL.md (and any sibling files in the skill folder).

---

### User Story 2 - Install to an explicit target directory (Priority: P1)

A user whose agent is not auto-detected, or who wants skills in a custom location, runs the install command with an explicit target directory. The skills are copied there regardless of which agent they use.

**Why this priority**: This is the escape hatch that makes the feature genuinely agent-agnostic — it works for the long tail of agents the tool does not (yet) know about, which is the whole premise. It is as essential as auto-detection.

**Independent Test**: Run the install command with an explicit target pointing at an arbitrary empty directory and confirm the bundled skills are copied into it.

**Acceptance Scenarios**:

1. **Given** the user passes an explicit target directory, **When** the command runs, **Then** the bundled skills are copied into that directory and auto-detection is bypassed.
2. **Given** the target directory does not yet exist, **When** the command runs, **Then** the directory is created and the skills are copied into it.

---

### User Story 3 - Safe re-install and preview (Priority: P2)

A user who has installed skills before runs the command again — for example after a runboard upgrade — and is not surprised by silent overwrites of files they may have edited. They can also preview what would be installed before committing to it.

**Why this priority**: Re-running after an upgrade is the common second interaction. Protecting user edits and offering a dry run builds the trust that the deterministic, local-first product depends on, but the tool is still useful on first run without it.

**Independent Test**: Install once, modify an installed skill file, run install again, and confirm the user is warned and/or must opt in before the edited file is overwritten; separately, run a preview and confirm nothing is written.

**Acceptance Scenarios**:

1. **Given** skills are already present at the destination, **When** the user re-runs install without an overwrite opt-in, **Then** the command does not silently overwrite existing files and clearly communicates what was skipped.
2. **Given** the user requests a preview (dry run), **When** the command runs, **Then** it lists the skills and destination that would be used and writes nothing to disk.
3. **Given** the user opts in to overwriting, **When** the command runs, **Then** existing skill files are replaced with the bundled versions.

---

### Edge Cases

- **No agent detected and no target given**: the command must not guess silently; it explains that no agent directory was found and tells the user how to specify a target.
- **Multiple agent directories present**: the command makes clear which target(s) it will use rather than picking one ambiguously.
- **Destination not writable / permission denied**: the command fails with a clear, actionable message and does not leave a half-written set of skills.
- **Bundled skills missing or unreadable** (corrupt/partial install of the package): the command reports the problem instead of producing an empty install.
- **Target path points at a file, not a directory**: the command refuses with a clear error.
- **Partial pre-existing install** (some skills present, some absent): the command reconciles per-skill rather than treating the whole set as all-or-nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST provide a `skills install` command surfaced through the same entry point users already invoke (the `runboard` CLI, runnable via npx).
- **FR-002**: The command MUST copy the skills bundled with the installed package as the source of truth; it MUST NOT fetch skills over the network.
- **FR-003**: Each skill MUST be installed as a self-contained folder preserving its `SKILL.md` and any sibling files, so the skill works unmodified in the destination.
- **FR-004**: When no target is specified, the command MUST attempt to auto-detect a recognised agent skills location in or under the current project and install there.
- **FR-005**: The command MUST accept an explicit `--target <dir>` option that overrides auto-detection and installs into the given directory.
- **FR-006**: When an explicit target directory (or required intermediate directories) does not exist, the command MUST create it.
- **FR-007**: When no target is given and no agent location can be detected, the command MUST stop without writing and instruct the user how to supply a target.
- **FR-008**: The command MUST NOT silently overwrite existing destination files; it MUST require an explicit opt-in (e.g. a force flag) to replace files that already exist.
- **FR-009**: The command MUST offer a preview/dry-run mode that reports the source skills and resolved destination without writing anything.
- **FR-010**: On completion the command MUST report a clear summary: which skills were installed, skipped, or overwritten, and the destination path(s) used.
- **FR-011**: On any failure (unwritable destination, invalid target, missing bundled skills) the command MUST exit with a non-zero status and a descriptive message, leaving the destination in a predictable state.
- **FR-012**: The command MUST NOT duplicate or reimplement any scoring, delta, trigger, or constraint logic; it only moves skill files. (Upholds the single-source-of-truth design rule.)
- **FR-013**: The command MUST operate entirely locally with no telemetry or network calls, consistent with the product's no-phone-home rule.

### Key Entities *(include if feature involves data)*

- **Bundled skill**: A folder shipped inside the runboard package containing a `SKILL.md` (with `name`/`description` frontmatter) and optionally supporting files. The authoritative source for installation.
- **Installed skill**: A copy of a bundled skill placed at the destination where a specific agent discovers skills.
- **Agent skills location**: A directory convention a given AI agent reads skills from (e.g. `.claude/skills/`). The target of installation, either auto-detected or explicitly provided.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user with a supported agent can install all bundled skills with a single command and no manual file copying.
- **SC-002**: After running the command, 100% of the bundled skills are present and byte-faithful at the resolved destination.
- **SC-003**: A user whose agent is not auto-detected can still install every skill in one command by supplying a target directory.
- **SC-004**: Re-running the command after an upgrade never destroys a user-edited skill file without an explicit overwrite opt-in (zero silent overwrites).
- **SC-005**: When installation cannot proceed, the user receives an actionable message that names the cause and the next step, with a non-zero exit status in 100% of failure cases.
- **SC-006**: A user can preview exactly what would be installed and where, without any files being written.

## Assumptions

- The skills are already packaged with the distribution (`skills/` is included in the package `files`), so no new bundling or download mechanism is required.
- SKILL.md is treated as the cross-agent open format; "installing" means placing folders where an agent looks, not transforming their contents.
- The primary auto-detected agent for v1 is Claude Code (`.claude/skills/`); additional agent directory conventions can be added over time without changing the command's surface. The explicit `--target` option covers any agent not yet auto-detected.
- Detection is scoped to the user's current project/working directory (local-first), not global machine-wide locations, unless the user passes an explicit target.
- Per existing repo conventions, the command is part of the `runboard` CLI and shares its conventions for help text, exit codes, and output style.
- The set of skills installed is the full bundled set; selecting individual skills is out of scope for v1.
