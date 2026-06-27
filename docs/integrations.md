# Integrating Runboard with AI providers

Runboard's MCP server runs **locally over stdio** and ships in the same npm package as the
CLI. The canonical command is the same everywhere:

```bash
npx -y runboard mcp
```

The server reads the `.runboard/` in whatever directory the client launches it from, so
point your tool at the project you want to assess (run `npx runboard@latest init` there
first if needed).

> **Local stdio only.** These instructions are for tools that spawn a local MCP process
> (desktop apps and CLIs). Web chat surfaces such as ChatGPT.com "connectors" and the
> Claude.ai web app expect a *remote* MCP server (HTTP/SSE URL), which Runboard does not
> provide by design — it never phones home. Use the local clients below.

For desktop apps and editors (Claude Desktop, Cursor, VS Code), see also
[mcp.md](./mcp.md). This page is organised by AI provider.

---

## Anthropic (Claude)

### Claude Code (CLI)

Register the server with one command:

```bash
claude mcp add runboard -- npx -y runboard mcp
```

Add `-s user` to make it available across all your projects, or `-s project` to share it
with your team via a checked-in `.mcp.json`. Verify with `claude mcp list`, then ask Claude
to "show my Runboard status."

### Claude Desktop

Edit `claude_desktop_config.json` and add the server, then restart the app:

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

---

## OpenAI (Codex)

The OpenAI path for a local stdio server is the **Codex CLI**.

Register it with the CLI:

```bash
codex mcp add runboard -- npx -y runboard mcp
```

Or add it directly to `~/.codex/config.toml` (or a project-scoped `.codex/config.toml`):

```toml
[mcp_servers.runboard]
command = "npx"
args = ["-y", "runboard", "mcp"]
```

Start `codex`, then ask it to run a Runboard tool (e.g. "show my Runboard status").

---

## Google (Gemini)

Use the **Gemini CLI**. Add the server to `~/.gemini/settings.json` (user scope) or a
project `.gemini/settings.json`:

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

Run `gemini`, then `/mcp` to confirm the `runboard` server is connected, and ask it to use
a Runboard tool.

---

## Fallback: the direct bin

Every example above routes through the default `runboard` package. If a tool needs to call
the server bin directly, both of these also work:

```bash
npx -y -p runboard runboard-mcp     # zero-install, direct bin
runboard-mcp                        # if installed globally (npm i -g runboard)
```

## Tools exposed

| Tool | Mirrors |
|------|---------|
| `runboard_assess` | `runboard assess --set …` |
| `runboard_board` | `runboard board [--html]` |
| `runboard_pulse` | `runboard pulse` |
| `runboard_roadmap` | `runboard roadmap` |
| `runboard_report` | `runboard report --type …` |
| `runboard_status` | `runboard status` |

Each tool returns results equal to the matching CLI command for the same `.runboard/`
state. In an uninitialised directory, a tool returns guidance to run `runboard init` rather
than failing opaquely.

> Client config formats change over time — if a command above is rejected, check the
> client's current MCP documentation. The Runboard side never changes: a local stdio server
> launched via `npx -y runboard mcp`.
