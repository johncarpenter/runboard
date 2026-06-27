import { readFileSync } from "node:fs";

// Single source of truth for the version. The CLI (`--version`) and the MCP server both
// import this so the package, the CLI, and the server can never report different versions
// (Constitution Principle III; spec FR-004 / SC-003).
//
// `../package.json` resolves to the repo root from `src/version.ts` and, once bundled, from
// `dist/*.js` — both live exactly one directory below the package root.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

export const VERSION: string = pkg.version;
