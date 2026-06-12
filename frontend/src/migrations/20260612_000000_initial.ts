/**
 * Initial schema for all Payload collections/globals, created from a
 * pg_dump of the dev database (drizzle push) because `payload
 * migrate:create` codegen is currently broken under the CLI's tsx loader.
 * Raw-SQL migrations are a documented Payload pattern; the DDL lives in
 * the sibling .sql file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  sql,
  type MigrateDownArgs,
  type MigrateUpArgs,
} from "@payloadcms/db-postgres";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const ddl = fs.readFileSync(
    path.join(dirname, "20260612_000000_initial.sql"),
    "utf8"
  );
  await db.execute(sql.raw(ddl));
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw('DROP SCHEMA IF EXISTS "payload" CASCADE;'));
}
