import { startMcpServer } from "./server.js";

// Bin entry for `runboard-mcp` (and `npx -y -p runboard runboard-mcp`). The canonical
// path is `npx -y runboard mcp`, which routes through the CLI subcommand; both call the
// same startMcpServer().
startMcpServer().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
