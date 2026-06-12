import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { BlogPosts } from "@/payload/collections/BlogPosts";
import { Categories } from "@/payload/collections/Categories";
import { Media } from "@/payload/collections/Media";
import { Projects } from "@/payload/collections/Projects";
import { Users } from "@/payload/collections/Users";
import { About } from "@/payload/globals/About";
import { SiteSettings } from "@/payload/globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Local dev uses DATABASE_URI (.env.local); the Vercel-Neon marketplace
// integration injects DATABASE_URL (pooled) and never DATABASE_URI.
const databaseURI = process.env.DATABASE_URI || process.env.DATABASE_URL || "";

// Misconfiguration must fail the build loudly — every page-level fetch is
// wrapped in try/catch, so a silently empty connection string would otherwise
// deploy a blank site with a broken admin.
if (process.env.NODE_ENV === "production") {
  if (!databaseURI) {
    throw new Error(
      "Payload: neither DATABASE_URI nor DATABASE_URL is set in production"
    );
  }
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("Payload: PAYLOAD_SECRET is not set in production");
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Projects, BlogPosts],
  globals: [About, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    // Keep Payload tables isolated from any Strapi tables sharing the database
    schemaName: "payload",
    pool: {
      connectionString: databaseURI,
    },
    // Dev push must never run against a migration-managed database
    // (e.g. when seeding prod from a local dev server): PAYLOAD_DB_PUSH=false
    ...(process.env.PAYLOAD_DB_PUSH === "false" ? { push: false } : {}),
  }),
  // Vercel Blob in production; local disk uploads in dev (no token set).
  // clientUploads off: uploads proxy through the server (fine under Vercel's
  // 4.5MB body limit) and the admin importMap stays identical in dev and prod.
  // disablePayloadAccessControl: media is public (read: () => true), so serve
  // absolute Blob CDN URLs instead of proxying files through a function.
  plugins: process.env.BLOB_READ_WRITE_TOKEN
    ? [
        vercelBlobStorage({
          collections: { media: { disablePayloadAccessControl: true } },
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }),
      ]
    : [],
  sharp,
});
