/**
 * Test DB connection via Neon serverless driver (port 443).
 * Run: npx dotenv -e .env.local -- node scripts/test-db-connection.mjs
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Add it to .env.local");
    process.exit(1);
  }
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT 1 AS ok, current_database() AS db`;
    console.log("OK – Prisma/Neon connection (port 443):", rows[0]);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

main();
