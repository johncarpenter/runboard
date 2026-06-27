import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/main.ts",
    mcp: "mcp/main.ts",
  },
  format: ["esm"],
  target: "node20",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
});
