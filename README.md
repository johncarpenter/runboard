# Runboard

**See your technical-leadership maturity scorecard in five minutes — local-first, no signup, nothing leaves your machine.**

Runboard is a CLI that runs the Runboard framework: a nine-dimension maturity instrument
(Build / Run / Plan × Team / Tools / Techniques), scored 1–5 with trajectory indicators.
It renders your scorecard as a heatmap, tells you your single biggest constraint, and
tracks whether things are getting better over time.

## Quickstart

```bash
npx runboard@latest init      # scaffold .runboard/ in your repo
npx runboard@latest assess    # guided 9-dimension self-assessment
npx runboard@latest board     # your heatmap + average + biggest constraint
```

Then, once you have data:

```bash
npx runboard@latest roadmap       # Now / Next / Later plan from your constraint
npx runboard@latest board --html  # a shareable, self-contained board.html
npx runboard@latest pulse         # (after a 2nd assessment) what moved since last time
npx runboard@latest status        # one-screen current state
```

## Local-first, no phone-home

Every command runs entirely on your machine. **No account, no network calls, no
telemetry.** Your data lives in `.runboard/` in your own repo — commit it, and its git
history becomes your trajectory record.

## Commands

| Command | What it does |
|---------|--------------|
| `runboard init` | Scaffold `.runboard/` (config, rubric, assessments). Idempotent. |
| `runboard assess` | Record a 9-dimension assessment (interactive, or `--set` for agents). |
| `runboard board [--html]` | Render the heatmap; `--html` writes a shareable file. |
| `runboard pulse` | Compare the two latest assessments; flag stuck dimensions. |
| `runboard roadmap` | Now/Next/Later plan from your binding constraint. |
| `runboard report --type <t>` | Render a board-ready report from a template. |
| `runboard status` | One-screen current state. |
| `runboard skills install [--target <dir>]` | Copy the bundled SKILL.md skills into an agent's skills directory. |

## Use it from your AI assistant

Portable `skills/` (SKILL.md) and an MCP server let Claude, Cursor, Codex, Copilot, Gemini,
and other agents run the assessment conversation and persist results through the same core
— the numbers are always computed by the tool, never by the model.

The MCP server ships in this same package and runs locally over stdio (no network, no
account). Add it to your client with one zero-install command:

```jsonc
{
  "mcpServers": {
    "runboard": { "command": "npx", "args": ["-y", "runboard", "mcp"] }
  }
}
```

See [docs/mcp.md](./docs/mcp.md) for Claude Desktop, Cursor, and VS Code setup.

### Installing the skills

SKILL.md is a cross-agent open format, so "installing" a skill just means copying its
folder to wherever your agent looks for skills. `skills install` does that from the copy
already bundled in this package — no download, no network:

```bash
npx runboard@latest skills install                 # auto-detect (Claude Code → .claude/skills/)
npx runboard@latest skills install --target .cursor/skills   # any other agent
npx runboard@latest skills install --dry-run       # preview; writes nothing
npx runboard@latest skills install --force         # overwrite existing copies (e.g. after upgrade)
```

Without `--target` it auto-detects a supported agent (v1: Claude Code, via a `.claude/`
directory). For any other agent, point `--target` at its skills directory. Existing skills
are never overwritten without `--force`. Restart your agent afterward so it discovers them.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). This is a public project; work starts from
GitHub issues.

## License

[MIT](./LICENSE)
