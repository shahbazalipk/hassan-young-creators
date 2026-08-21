import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || "/data";
const dbFile = process.env.DATABASE_URL?.replace(/^file:/, "") || path.join(dataDir, "prod.db");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });
fs.mkdirSync(path.join(process.cwd(), "public", "uploads"), { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Preparing production database...");
run("npx", ["prisma", "db", "push", "--skip-generate"]);
run("npx", ["tsx", "prisma/seed.ts"]);
run("npx", ["tsx", "scripts/seed-flash-questions.ts"]);
run("node", ["scripts/set-public-project-urls.mjs"]);

const port = process.env.PORT || "3000";
console.log(`Starting Hassan portfolio on port ${port}...`);
run("npx", ["next", "start", "-H", "0.0.0.0", "-p", port]);
