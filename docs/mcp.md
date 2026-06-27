# Runboard MCP server

Runboard ships an MCP server alongside the CLI — same package, same version, same
deterministic core. Tool-calling AI clients (Claude Desktop, Cursor, VS Code, and others)
can run the assessment conversation and read your scorecard through it. The numbers are
always computed by the tool, never by the model.

It runs **locally over stdio**. No account, no network calls, no hosted service — exactly
like the CLI.

## Zero-install setup

Prerequisite: Node ≥ 20. Nothing to clone or build.

The canonical command is:

```bash
npx -y runboard mcp
```

The server reads the `.runboard/` in whatever directory your client launches it from, so
point your client at the project you want to assess (run `npx runboard@latest init` there
first if needed).

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "runboard": {
      "command": "npx",
      "args": ["-y", "runboard", "mcp"]
    }
  }
}
```

Restart Claude Desktop; the `runboard_*` tools appear.

### Cursor

Settings → MCP → Add server, then add the same entry:

```json
{
  "mcpServers": {
    "runboard": {
      "command": "npx",
      "args": ["-y", "runboard", "mcp"]
    }
  }
}
```

### VS Code

In `.vscode/mcp.json` (or your MCP extension's settings):

```json
{
  "servers": {
    "runboard": {
      "command": "npx",
      "args": ["-y", "runboard", "mcp"]
    }
  }
}
```

### Fallback / direct bin

The server is also exposed as a `runboard-mcp` bin in the same package:

```bash
npx -y -p runboard runboard-mcp     # zero-install, direct bin
runboard-mcp                        # if installed globally (npm i -g runboard)
```

## Tools

| Tool | Mirrors | Notes |
|------|---------|-------|
| `runboard_assess` | `runboard assess --set …` | the client supplies the 9 scores |
| `runboard_board` | `runboard board [--html]` | heatmap cells, average, trajectory counts |
| `runboard_pulse` | `runboard pulse` | deltas + stuck-dimension triggers (needs ≥ 2 assessments) |
| `runboard_roadmap` | `runboard roadmap` | Now/Next/Later from the binding constraint |
| `runboard_report` | `runboard report --type …` | board-update / baseline / monthly |
| `runboard_status` | `runboard status` | one-screen current state |

Each tool returns results **equal to the matching CLI command** for the same `.runboard/`
state. In a directory that hasn't been initialised, a tool returns guidance to run
`runboard init` rather than failing opaquely.

## Verify

Ask your assistant to "show my Runboard status." It calls `runboard_status` and returns the
current state (or tells you to run `runboard init` first).
