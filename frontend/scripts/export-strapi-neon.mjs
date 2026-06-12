/**
 * Export the legacy Strapi content from the old Neon database (quota-locked
 * until ~July 2026) so it can be reconciled into Payload.
 *
 * Reads OLD_NEON_DATABASE_URL from frontend/.env.local.
 * Usage (from frontend/): node scripts/export-strapi-neon.mjs
 * Output: ../migration-data/strapi-export/<table>.json
 *
 * Reconcile against Payload afterwards: anything in blog_posts beyond the
 * 3 seeded slugs, draft rows (published_at IS NULL), and post-Jan edits to
 * the 9 projects.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import pg from "pg";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(dirname, "..");
const outDir = path.resolve(frontendRoot, "..", "migration-data", "strapi-export");

for (const line of fs
  .readFileSync(path.join(frontendRoot, ".env.local"), "utf8")
  .split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const url = process.env.OLD_NEON_DATABASE_URL;
if (!url) {
  console.error("OLD_NEON_DATABASE_URL not set in frontend/.env.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

fs.mkdirSync(outDir, { recursive: true });

const tables = await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' ORDER BY table_name`
);
const names = tables.rows.map((r) => r.table_name);
console.log(`tables found: ${names.length}`);

// Export every Strapi content/link/component/file table — small DB, take it all.
for (const t of names) {
  const rows = await client.query(`SELECT * FROM "${t}"`);
  fs.writeFileSync(
    path.join(outDir, `${t}.json`),
    JSON.stringify(rows.rows, null, 2)
  );
  console.log(`${t}: ${rows.rows.length} rows`);
}

await client.end();
console.log(`\nEXPORT COMPLETE -> ${outDir}`);
