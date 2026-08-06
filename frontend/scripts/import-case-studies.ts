/**
 * Publish the two 2026 case studies (B2B wholesale + staffing operations) into
 * Payload, and unfeature everything that is not part of the new featured set.
 *
 *   dry-run (default):  npx payload run scripts/import-case-studies.ts
 *   execute:            npx payload run scripts/import-case-studies.ts -- --execute
 *
 * The bare `--` is required: `payload run` rewrites process.argv and only
 * forwards what follows it. Without it the flag is invisible and the script
 * dry-runs — safe, but it will look like nothing happened.
 *
 * Idempotent: media dedupe on filename, projects upsert on slug.
 *
 * Source content lives in src/migration/case-studies/ (alongside the existing
 * migration import sources) rather than a temp dir, so a later production run
 * does not depend on a scratchpad that has since been cleaned up.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "src", "migration", "case-studies");
const IMAGES = path.join(SRC, "captures");

const EXECUTE = process.argv.includes("--execute");

// The public site only ever renders this category's projects correctly; a
// project with no category shows "Uncategorized" and disappears behind filters.
const CATEGORY_SLUG = "web-dev";
// Kept featured alongside the two new case studies.
const KEEP_FEATURED = "tredye-trading-platform";

/**
 * start_date is what actually orders the cards: the public query sorts
 * ["-featured", "-start_date", "-createdAt"] and ignores featured_order
 * entirely. These are the real first-commit dates of each source repo
 * (`git log --reverse --format=%as | head -1`), captured 2026-08-05:
 *   D:\Projects\offpriced          -> 2026-05-15
 *   D:\Projects\laborithm web app  -> 2026-07-01
 */
const CASE_STUDIES = [
  {
    file: "case-study-staffing.md",
    start_date: "2026-07-01",
    featured_order: 1,
    images: [
      ["staffing-platform-admin.png", "Staffing platform admin portal: placements, client companies, invoicing and approvals"],
      ["staffing-platform-client-portal.png", "Client portal where a hiring company reviews its workforce, signs off work and sees its invoices"],
      ["staffing-platform-worker-portal.png", "Worker portal showing pay history, documents and open roles to apply for"],
      ["staffing-platform-partner-ledger.png", "Partner portal ledger of placements sourced and commission earned by a recruiter"],
      ["staffing-platform-onboarding.png", "Guided onboarding flow that converts a prospective client into a client account"],
    ],
  },
  {
    file: "case-study-wholesale.md",
    start_date: "2026-05-15",
    featured_order: 2,
    images: [
      ["offpriced-storefront.png", "Offpriced public storefront showing The Floor, the catalogue of wholesale clothing lots currently available"],
      ["offpriced-buyer-portal.png", "Signed-in buyer portal with the line sheet a buyer assembles from The Floor"],
      ["offpriced-deal-detail.png", "Deal detail view tracking an enquiry through quote, order and delivery"],
      ["offpriced-manager-inbox.png", "Internal operations inbox where staff answer buyer enquiries from a phone"],
      ["offpriced-admin-cms.png", "Admin CMS where the business edits every page of the public site"],
    ],
  },
] as const;

/* ---------------------------------------------------------------- guards --
 * These run before @payload-config is imported, because that module reads
 * PAYLOAD_DB_PUSH and the connection string at module scope. Hence the
 * dynamic import further down — a static one would hoist above this.
 */
const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL || "";
if (!dbUrl) {
  throw new Error("neither DATABASE_URI nor DATABASE_URL is set — refusing to run");
}
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl);

// Anything not on localhost is treated as production. The Vercel Blob plugin is
// token-gated: without the token, payload.create() writes to local disk and the
// production rows end up pointing at files that do not exist on the CDN.
if (!isLocal && !process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error(
    "target database is not local but BLOB_READ_WRITE_TOKEN is unset — media " +
      "would upload to local disk and production image URLs would point at nothing"
  );
}

// This script never needs to create schema. Forcing push off is stronger than
// asking a human to remember: drizzle push can silently mutate a
// migration-managed database.
process.env.PAYLOAD_DB_PUSH = "false";

console.log(`mode      : ${EXECUTE ? "EXECUTE (writes)" : "DRY RUN (reads only)"}`);
console.log(`database  : ${isLocal ? "local" : "REMOTE / production"} (${dbUrl.replace(/:[^:@/]*@/, ":***@")})`);
console.log(`blob store: ${process.env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob" : "local disk"}`);
console.log("");

/* ----------------------------------------------------------- md parsing -- */

const END_MARKER = /^<!-- END METADATA.*-->[ \t]*$/m;

function unquote(s: string) {
  const t = s.trim();
  // No dotAll flag: values always come from a single line of the header.
  return /^(".*"|'.*')$/.test(t) ? t.slice(1, -1) : t;
}

/** Splits the `<!-- CMS METADATA -->` header off, and parses its plain YAML. */
function parseCaseStudy(file: string) {
  const raw = fs.readFileSync(path.join(SRC, file), "utf8").replace(/\r\n/g, "\n");
  const end = raw.match(END_MARKER);
  if (!raw.startsWith("<!-- CMS METADATA") || !end || end.index === undefined) {
    throw new Error(`${file}: CMS METADATA / END METADATA markers not found`);
  }
  const head = raw.slice(raw.indexOf("\n") + 1, end.index);
  const content = raw.slice(end.index + end[0].length).trim();

  const meta: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (const line of head.split("\n")) {
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (meta[listKey] as string[]).push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([a-z_]+):[ \t]*(.*)$/);
    if (!kv) throw new Error(`${file}: unparsable metadata line: ${JSON.stringify(line)}`);
    if (kv[2] === "") {
      listKey = kv[1];
      meta[listKey] = [];
    } else {
      meta[kv[1]] = unquote(kv[2]);
      listKey = null;
    }
  }

  // The markers and YAML render as visible text on the public page if they leak.
  if (/CMS METADATA|END METADATA/.test(content) || !content.startsWith("# ")) {
    throw new Error(`${file}: content did not split cleanly from the metadata block`);
  }
  for (const k of ["title", "slug", "description", "category"]) {
    if (typeof meta[k] !== "string") throw new Error(`${file}: missing '${k}'`);
  }
  if (!Array.isArray(meta.technologies) || !meta.technologies.length) {
    throw new Error(`${file}: missing 'technologies'`);
  }
  if (meta.category !== CATEGORY_SLUG) {
    throw new Error(`${file}: category '${meta.category}' — expected '${CATEGORY_SLUG}'`);
  }
  return { meta, content } as {
    meta: { title: string; slug: string; description: string; category: string; live_url?: string; technologies: string[] };
    content: string;
  };
}

/* ------------------------------------------------------------------ run -- */

const { default: config } = await import("@payload-config");
const { getPayload } = await import("payload");
const { cmsProjects } = await import("@/lib/cms");

const payload = await getPayload({ config });

const category = await payload.find({
  collection: "categories",
  where: { slug: { equals: CATEGORY_SLUG } },
  limit: 1,
});
if (!category.docs[0]) {
  // Slugs are unique and the site's filter chips key off existing categories —
  // creating one here would be a schema decision, not an import.
  throw new Error(`category '${CATEGORY_SLUG}' not found — create it in /admin first`);
}
const categoryId = category.docs[0].id;
console.log(`category  : ${CATEGORY_SLUG} -> #${categoryId}\n`);

async function ensureMedia(filename: string, alt: string): Promise<number | null> {
  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (existing.docs[0]) {
    console.log(`  media  keep   ${filename} (#${existing.docs[0].id})`);
    return existing.docs[0].id as number;
  }
  const filePath = path.join(IMAGES, filename);
  if (!fs.existsSync(filePath)) throw new Error(`missing image: ${filePath}`);
  if (!EXECUTE) {
    console.log(`  media  UPLOAD ${filename}`);
    return null;
  }
  const doc = await payload.create({ collection: "media", data: { alt }, filePath });
  console.log(`  media  upload ${filename} (#${doc.id})`);
  return doc.id as number;
}

const newSlugs: string[] = [];

for (const cs of CASE_STUDIES) {
  const { meta, content } = parseCaseStudy(cs.file);
  newSlugs.push(meta.slug);
  console.log(`${meta.slug}  (start_date ${cs.start_date}, ${content.length} chars of content)`);

  const imageIds: (number | null)[] = [];
  for (const [filename, alt] of cs.images) imageIds.push(await ensureMedia(filename, alt));

  const existing = await payload.find({
    collection: "projects",
    where: { slug: { equals: meta.slug } },
    limit: 1,
    draft: true,
  });

  const data = {
    title: meta.title,
    slug: meta.slug,
    description: meta.description,
    content,
    technologies: meta.technologies.map((name) => ({ name })),
    category: categoryId,
    featured: true,
    featured_order: cs.featured_order,
    live_url: meta.live_url ?? null,
    start_date: cs.start_date,
    cover_image: imageIds[0],
    gallery: imageIds.slice(1).filter((id): id is number => id !== null),
    // Without this the row is a draft and every public query filters it out.
    _status: "published" as const,
  };

  if (!EXECUTE) {
    console.log(`  project WOULD ${existing.docs[0] ? `update #${existing.docs[0].id}` : "create"}\n`);
    continue;
  }
  const doc = existing.docs[0]
    ? await payload.update({ collection: "projects", id: existing.docs[0].id, data })
    : await payload.create({ collection: "projects", data });
  console.log(`  project ${existing.docs[0] ? "update" : "create"} #${doc.id} _status=${doc._status}\n`);
}

/* --------------------------------------------------------- unfeaturing -- */

const keep = new Set([KEEP_FEATURED, ...newSlugs]);
const all = await payload.find({ collection: "projects", limit: 500, depth: 0, draft: true });
console.log(`currently featured (${all.docs.filter((p) => p.featured).length} of ${all.docs.length} projects):`);
for (const p of all.docs.filter((d) => d.featured)) console.log(`  ${p.slug}`);
console.log("");

for (const p of all.docs) {
  if (keep.has(p.slug) || !p.featured) continue;
  if (!EXECUTE) {
    console.log(`unfeature WOULD ${p.slug} (#${p.id})`);
    continue;
  }
  // Pass _status through so unfeaturing never changes publication state.
  await payload.update({
    collection: "projects",
    id: p.id,
    data: { featured: false, _status: p._status as "draft" | "published" },
  });
  console.log(`unfeature ${p.slug} (#${p.id})`);
}

/* -------------------------------------------------------------- summary -- */

// Uses the site's own query, so this is the order the cards actually render in.
const featured = await cmsProjects({ featured: true });
console.log(`\nfeatured order the site will render (${featured.length} cards):`);
featured.forEach((p, i) =>
  console.log(`  ${i + 1}. ${p.slug}  start_date=${p.start_date?.slice(0, 10)}  featured_order=${p.featured_order}`)
);

if (!EXECUTE) {
  console.log("\nDRY RUN — nothing was written. To apply:");
  console.log("  npx payload run scripts/import-case-studies.ts -- --execute");
  console.log("  (the bare -- is required, or the flag never reaches this script)");
}

process.exit(0);
