# Quickstart: Runboard MCP Server

**Feature**: 002-mcp-distribution | **Date**: 2026-06-27

Two audiences: a **user** adding Runboard to their AI client, and a **maintainer**
publishing the package. Both reach the same single artifact.

---

## For users — add Runboard to your AI client (zero install)

Prerequisite: Node ≥ 20 installed. Nothing else — no clone, no build.

The server reads the `.runboard/` in whatever directory your client launches it from, so
point your client at the project you want to assess (or run `npx runboard@latest init`
there first).

### Claude Desktop

Edit your `claude_desktop_config.json` and add:

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

Restart Claude Desktop. The `runboard_*` tools appear in the tool list.

### Cursor

In Cursor's MCP settings (Settings → MCP → Add server), add the same server entry:

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

In your MCP configuration (`.vscode/mcp.json` or user settings, depending on your
extension), add:

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

### Verify

Ask your assistant to "show my Runboard status." It should call `runboard_status` and
return the current state — or, if the project has no `.runboard/` yet, tell you to run
`runboard init` first. If you prefer the direct bin form, use
`npx -y -p runboard runboard-mcp` instead of `npx -y runboard mcp`.

---

## For maintainers — publish both surfaces in one action

The MCP server ships **inside** the `runboard` package. There is no separate package.

```bash
npm version <patch|minor|major>   # bumps the single source of truth
npm publish                        # prepublishOnly gate runs first
```

`prepublishOnly` runs lint → typecheck → tests → build before anything leaves your
machine. The build emits both `dist/cli.js` and `dist/mcp.js`; the package declares both
`runboard` and `runboard-mcp` bins. After publish, both `npx runboard@latest <cmd>` and
`npx -y runboard mcp` resolve to the new version, and the server reports that same version.

### What CI guards

- CLI smoke (`node dist/cli.js --version`).
- MCP smoke: boot the server over stdio and list tools.
- Parity: every MCP tool equals its CLI command for the same fixture.
- No-network: server boot and tool calls open no sockets.
- Packaging: `dist/mcp.js` is in the tarball and both bins are declared.

---

## Success check (maps to spec Success Criteria)

- [ ] From a clean machine with only Node, a user reaches working tools in < 5 min (SC-001).
- [ ] MCP tool output equals CLI output for identical state (SC-002).
- [ ] Server and CLI report the same version (SC-003).
- [ ] No outbound network connections during boot or tool calls (SC-004).
- [ ] One publish ships both surfaces (SC-005).
- [ ] Setup docs exist and are verified for Claude Desktop, Cursor, VS Code (SC-006).
