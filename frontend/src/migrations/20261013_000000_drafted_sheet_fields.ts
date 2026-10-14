/** Additive, idempotent (IF [NOT] EXISTS): safe against push-created dev columns and re-runs. */
import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export const UP_SQL = `
ALTER TABLE payload.projects
  ADD COLUMN IF NOT EXISTS sheet_short_title character varying,
  ADD COLUMN IF NOT EXISTS sheet_kind character varying,
  ADD COLUMN IF NOT EXISTS sheet_client character varying,
  ADD COLUMN IF NOT EXISTS sheet_problem character varying,
  ADD COLUMN IF NOT EXISTS sheet_built character varying,
  ADD COLUMN IF NOT EXISTS sheet_decisions character varying,
  ADD COLUMN IF NOT EXISTS sheet_outcome character varying,
  ADD COLUMN IF NOT EXISTS drawing jsonb;
ALTER TABLE payload._projects_v
  ADD COLUMN IF NOT EXISTS version_sheet_short_title character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_kind character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_client character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_problem character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_built character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_decisions character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_outcome character varying,
  ADD COLUMN IF NOT EXISTS version_drawing jsonb;`;

export const DOWN_SQL = `
ALTER TABLE payload.projects
  DROP COLUMN IF EXISTS sheet_short_title, DROP COLUMN IF EXISTS sheet_kind, DROP COLUMN IF EXISTS sheet_client,
  DROP COLUMN IF EXISTS sheet_problem, DROP COLUMN IF EXISTS sheet_built, DROP COLUMN IF EXISTS sheet_decisions,
  DROP COLUMN IF EXISTS sheet_outcome, DROP COLUMN IF EXISTS drawing;
ALTER TABLE payload._projects_v
  DROP COLUMN IF EXISTS version_sheet_short_title, DROP COLUMN IF EXISTS version_sheet_kind, DROP COLUMN IF EXISTS version_sheet_client,
  DROP COLUMN IF EXISTS version_sheet_problem, DROP COLUMN IF EXISTS version_sheet_built, DROP COLUMN IF EXISTS version_sheet_decisions,
  DROP COLUMN IF EXISTS version_sheet_outcome, DROP COLUMN IF EXISTS version_drawing;`;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(UP_SQL));
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(DOWN_SQL));
}
