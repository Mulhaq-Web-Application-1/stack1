/**
 * Load .env.local then run a command. Use so Prisma CLI sees the same env as Next.js.
 * Usage: node scripts/run-with-env.js prisma migrate deploy
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const [,, ...args] = process.argv;
const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
