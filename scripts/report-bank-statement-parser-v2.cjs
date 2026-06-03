#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const result = spawnSync(process.execPath, [tsxCli, "scripts/report-bank-statement-parser-v2.ts", ...process.argv.slice(2)], {
  stdio: ["ignore", "pipe", "pipe"],
  encoding: "utf8",
});

if (result.error) {
  console.error(result.error);
}
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

process.exit(result.status ?? 1);
