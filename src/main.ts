import { main } from "./cli.js";

// Bin entry for `runboard` (bundled to dist/cli.js). Importing ./cli.js has no side
// effects; only this file runs the program.
main(process.argv).catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
