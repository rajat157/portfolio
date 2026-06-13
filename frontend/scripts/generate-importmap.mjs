/**
 * Wrapper for `payload generate:importmap`.
 *
 * The Vercel Blob plugin only loads when BLOB_READ_WRITE_TOKEN is set, and it
 * registers an admin component (VercelBlobClientUploadHandler) that the
 * production importMap MUST contain. Running the bare generator in dev (no
 * token) strips that entry and 500s /admin in prod. So force a placeholder
 * token here — the value is irrelevant to component generation.
 */
import { spawnSync } from "node:child_process";

// Must match the adapter's required format: vercel_blob_rw_<store>_<random>
process.env.BLOB_READ_WRITE_TOKEN ||=
  "vercel_blob_rw_PLACEHOLDER0000000_placeholder00000000000000000000";
process.env.PAYLOAD_SECRET ||= "importmap-generation-placeholder";
process.env.DATABASE_URI ||= "postgresql://localhost:5432/placeholder";

const result = spawnSync("payload", ["generate:importmap"], {
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
