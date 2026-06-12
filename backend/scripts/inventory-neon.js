// Inventory the Neon (production Strapi) database: what content exists, incl. drafts.
// Usage: node scripts/inventory-neon.js  (reads DATABASE_URL from backend/.env)
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("=== TABLES ===");
  console.log(tables.rows.map((r) => r.table_name).join(", "));

  const contentTables = ["projects", "blog_posts", "categories", "abouts", "site_settings"];
  for (const t of contentTables) {
    if (!tables.rows.some((r) => r.table_name === t)) {
      console.log(`\n=== ${t} === MISSING`);
      continue;
    }
    const count = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(`\n=== ${t} (${count.rows[0].count} rows incl. draft versions) ===`);
    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [t]
    );
    const names = cols.rows.map((r) => r.column_name);
    const pick = ["id", "document_id", "title", "name", "slug", "published_at", "updated_at"]
      .filter((c) => names.includes(c));
    const rows = await client.query(
      `SELECT ${pick.map((c) => `"${c}"`).join(", ")} FROM "${t}" ORDER BY id`
    );
    for (const row of rows.rows) console.log(JSON.stringify(row));
  }

  // Media files registered in Strapi
  if (tables.rows.some((r) => r.table_name === "files")) {
    const files = await client.query(`SELECT count(*) FROM files`);
    console.log(`\n=== files (uploads): ${files.rows[0].count} ===`);
    const sample = await client.query(`SELECT name, url, provider FROM files ORDER BY id LIMIT 5`);
    for (const row of sample.rows) console.log(JSON.stringify(row));
  }

  await client.end();
}

main().catch((e) => {
  console.error("INVENTORY FAILED:", e.message);
  process.exit(1);
});
