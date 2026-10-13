/**
 * Publish the 2026 case studies listed in CASE_STUDIES into Payload, and align
 * the featured set to exactly those slugs. A slug that already exists gets a
 * field-level sync (title, description, technologies, live_url, featured,
 * featured_order, sheet, drawing, and — with --content — the markdown body
 * itself); a new slug gets its media uploaded and the project created.
 *
 *   dry-run (default):  npx payload run scripts/import-case-studies.ts -- --content
 *   execute:             npx payload run scripts/import-case-studies.ts -- --content --execute
 *
 * The bare `--` is required: `payload run` rewrites process.argv and only
 * forwards what follows it. Without it the flags are invisible and the script
 * dry-runs — safe, but it will look like nothing happened. In PowerShell, npx
 * itself drops the bare `--` — use
 * `node_modules\.bin\payload.cmd run scripts/import-case-studies.ts -- --content --execute`
 * instead.
 *
 * A production run must pre-set BOTH `DATABASE_URI` (the production unpooled
 * URL) and `BLOB_READ_WRITE_TOKEN` in the process environment before invoking
 * `payload run` — otherwise its loadEnv step lets frontend/.env.local's local
 * `DATABASE_URI` win and the script silently targets the dev DB.
 *
 * Idempotent: media dedupe on filename; an existing slug's fields are synced
 * only when they actually differ (printed per field, `same` or `change`).
 * `--content` is separate from `--execute` because it governs whether the
 * markdown body itself is one of the synced fields — the riskiest one, since
 * an admin edit to the prose would be overwritten.
 *
 * Source content lives in src/migration/case-studies/ (alongside the existing
 * migration import sources) rather than a temp dir, so a later production run
 * does not depend on a scratchpad that has since been cleaned up.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isDeepStrictEqual } from "util";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "src", "migration", "case-studies");
const IMAGES = path.join(SRC, "captures");
const SHEETS_JSON_PATH = path.join(SRC, "sheets.json");

const EXECUTE = process.argv.includes("--execute");
const SYNC_CONTENT = process.argv.includes("--content");

// The public site only ever renders this category's projects correctly; a
// project with no category shows "Uncategorized" and disappears behind filters.
const CATEGORY_SLUG = "web-dev";

/**
 * start_date is what actually orders the cards: the public query sorts
 * ["-featured", "-start_date", "-createdAt"] for non-featured ties and
 * featured_order (from sheets.json) for featured ones. These are the real
 * first-commit dates of each source repo
 * (`git log --reverse --format=%as | head -1`), captured 2026-08-05 (Tredye:
 * the case study's own start_date, set when it was added as a sheet):
 *   D:\Projects\offpriced          -> 2026-05-15
 *   D:\Projects\laborithm web app  -> 2026-07-01
 *   D:\Projects\sam-portfolio      -> 2026-05-12
 */
const CASE_STUDIES = [
  {
    file: "case-study-staffing.md",
    start_date: "2026-07-01",
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
    images: [
      ["offpriced-storefront.png", "Offpriced public storefront showing The Floor, the catalogue of wholesale clothing lots currently available"],
      ["offpriced-buyer-portal.png", "Signed-in buyer portal with the line sheet a buyer assembles from The Floor"],
      ["offpriced-deal-detail.png", "Deal detail view tracking an enquiry through quote, order and delivery"],
      ["offpriced-manager-inbox.png", "Internal operations inbox where staff answer buyer enquiries from a phone"],
      ["offpriced-admin-cms.png", "Admin CMS where the business edits every page of the public site"],
    ],
  },
  {
    file: "case-study-esports-talent.md",
    start_date: "2026-05-12",
    images: [
      ["lucif3r-hero.jpg", "lucif3r home page hero with the glitch wordmark, booking status, headline stats and stage portrait"],
      ["lucif3r-hero-motion.mp4", "Screen recording of the hero: the RGB-split glitch on the wordmark and the gold shimmer sweep"],
      ["lucif3r-scroll-tour.mp4", "Screen recording of a smooth-scroll pass through the home page sections"],
      ["lucif3r-mobile.jpg", "Three mobile screens: the hero, the services accordion and the swipeable event carousel"],
      ["lucif3r-event-case-study.jpg", "An event case-study page with its title, event tags and the broadcast video preview"],
    ],
  },
  {
    file: "case-study-tredye.md",
    start_date: "2025-11-01",
    images: [] as [string, string][],
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

// Reverse guard: never let a local dev run point at production Blob storage.
if (isLocal && process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error(
    "target database is local but BLOB_READ_WRITE_TOKEN is set — refusing to upload " +
      "media to production Blob storage for local rows"
  );
}

// This script never needs to create schema. Forcing push off is stronger than
// asking a human to remember: drizzle push can silently mutate a
// migration-managed database.
process.env.PAYLOAD_DB_PUSH = "false";

console.log(`mode      : ${EXECUTE ? "EXECUTE (writes)" : "DRY RUN (reads only)"}${SYNC_CONTENT ? ", syncing content" : ""}`);
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

/* ------------------------------------------------------------- sheets.json --
 * Read with fs, never through @/lib/cms: a static import of that module
 * reaches @payload-config and would drizzle-push the target DB before
 * PAYLOAD_DB_PUSH=false above takes effect for a later dynamic import.
 */
type SheetFields = {
  short_title: string | null;
  kind: string | null;
  client: string | null;
  problem: string | null;
  built: string[];
  decisions: string[];
  outcome: string | null;
};
type SheetSource = {
  featured_order: number;
  description: string;
  technologies: string[];
  sheet: SheetFields;
  drawing: unknown;
};
const sheetsJson: Record<string, SheetSource> = JSON.parse(fs.readFileSync(SHEETS_JSON_PATH, "utf8"));

/* ------------------------------------------------------------------ run -- */

const { default: config } = await import("@payload-config");
const { getPayload } = await import("payload");
const { cmsProjects } = await import("@/lib/cms");
const { parseDrawing } = await import("@/lib/drawing");

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

/**
 * Guards a write against clobbering a pending draft. Payload's update()
 * without `draft` loads the LATEST version of the doc (which may be an
 * unpublished draft) and carries forward every field not passed —
 * including `_status` — so a bare partial write can silently publish
 * draft content and unpublish the project. Returns false (and prints SKIP)
 * when the latest version is a draft ahead of a published main doc.
 */
async function draftSafe(slug: string, id: number, mainStatus: string | null | undefined): Promise<boolean> {
  const latest = await payload.findByID({ collection: "projects", id, draft: true, depth: 0 });
  if (latest._status === "draft" && mainStatus === "published") {
    console.log(`SKIP ${slug}: has unpublished draft changes — publish or discard them in /admin, then re-run`);
    return false;
  }
  return true;
}

function charLen(v: unknown): number {
  return typeof v === "string" ? v.length : JSON.stringify(v ?? null).length;
}

/** Up to 40 lines on each side that differ, for a changed multi-line text field. */
function printLineDiff(oldStr: string, newStr: string) {
  const oldLines = new Set(oldStr.split("\n"));
  const newLines = new Set(newStr.split("\n"));
  const show = (head: string, lines: string[]) => {
    if (!lines.length) return;
    const more = lines.length > 40 ? `\n      … ${lines.length - 40} more lines` : "";
    console.log(`    ${head}:\n${lines.slice(0, 40).map((l) => "      " + l).join("\n")}${more}`);
  };
  show("only in current value", [...oldLines].filter((l) => !newLines.has(l)));
  show("only in new value", [...newLines].filter((l) => !oldLines.has(l)));
}

/** Prints `<label>  same` or `<label>  change (...)` (+ a line diff for text fields). Returns whether it changed. */
function diffField(label: string, oldVal: unknown, newVal: unknown, isText: boolean): boolean {
  if (isDeepStrictEqual(oldVal, newVal)) {
    console.log(`  ${label}  same`);
    return false;
  }
  const [o, n] = [JSON.stringify(oldVal ?? null), JSON.stringify(newVal ?? null)];
  // short values print in full, so a dry run shows exactly what a run would overwrite
  if (!isText && o.length <= 160 && n.length <= 160) console.log(`  ${label}  change: ${o} -> ${n}`);
  else console.log(`  ${label}  change (old ${charLen(oldVal)} chars -> new ${charLen(newVal)} chars)`);
  if (isText) printLineDiff(String(oldVal ?? ""), String(newVal ?? ""));
  return true;
}

const newSlugs: string[] = [];

for (const cs of CASE_STUDIES) {
  const { meta, content } = parseCaseStudy(cs.file);
  newSlugs.push(meta.slug);

  const sheetSrc = sheetsJson[meta.slug];
  if (!sheetSrc) throw new Error(`${meta.slug}: missing from sheets.json`);
  if (!isDeepStrictEqual(sheetSrc.description, meta.description)) {
    throw new Error(`${meta.slug}: sheets.json description does not match the md header — keep them in sync`);
  }
  if (!isDeepStrictEqual(sheetSrc.technologies, meta.technologies)) {
    throw new Error(`${meta.slug}: sheets.json technologies does not match the md header — keep them in sync`);
  }
  const wantSheet = {
    short_title: sheetSrc.sheet.short_title,
    kind: sheetSrc.sheet.kind,
    client: sheetSrc.sheet.client,
    problem: sheetSrc.sheet.problem,
    built: sheetSrc.sheet.built.join("\n"),
    decisions: sheetSrc.sheet.decisions.join("\n"),
    outcome: sheetSrc.sheet.outcome,
  };
  const wantDrawing = parseDrawing(sheetSrc.drawing);
  if (!wantDrawing) throw new Error(`${meta.slug}: sheets.json drawing failed to parse`);

  const existing = await payload.find({
    collection: "projects",
    where: { slug: { equals: meta.slug } },
    limit: 1,
  });

  if (existing.docs[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = existing.docs[0] as any;
    console.log(`${meta.slug}  exists — syncing fields`);
    const safe = await draftSafe(meta.slug, p.id, p._status);
    if (!safe) {
      console.log("");
      continue;
    }

    const fields: [string, unknown, unknown, boolean][] = [
      ["title", p.title, meta.title, false],
      ["description", p.description, meta.description, true],
      ["technologies", (p.technologies ?? []).map((t: { name: string }) => t.name), meta.technologies, false],
      ["live_url", p.live_url ?? null, meta.live_url ?? null, false],
      ["featured", p.featured, true, false],
      ["featured_order", p.featured_order ?? null, sheetSrc.featured_order, false],
      ["sheet.short_title", p.sheet?.short_title ?? null, wantSheet.short_title, false],
      ["sheet.kind", p.sheet?.kind ?? null, wantSheet.kind, false],
      ["sheet.client", p.sheet?.client ?? null, wantSheet.client, false],
      ["sheet.problem", p.sheet?.problem ?? null, wantSheet.problem, true],
      ["sheet.built", p.sheet?.built ?? null, wantSheet.built, true],
      ["sheet.decisions", p.sheet?.decisions ?? null, wantSheet.decisions, true],
      ["sheet.outcome", p.sheet?.outcome ?? null, wantSheet.outcome, true],
      ["drawing", p.drawing ?? null, wantDrawing, false],
      ...(SYNC_CONTENT ? ([["content", p.content ?? null, content, true]] as [string, unknown, unknown, boolean][]) : []),
    ];

    const changedTop = new Set<string>();
    for (const [label, oldVal, newVal, isText] of fields) {
      if (diffField(label, oldVal, newVal, isText)) changedTop.add(label.split(".")[0]);
    }

    const effectiveContent = SYNC_CONTENT ? content : p.content ?? "";
    console.log(`  flow fences: ${(effectiveContent.match(/```flow/g) ?? []).length}`);

    if (changedTop.size === 0) {
      console.log("  no changes");
    } else if (!EXECUTE) {
      console.log(`  WOULD update: ${[...changedTop].join(", ")}`);
    } else {
      const backup: Record<string, unknown> = {};
      for (const key of changedTop) {
        if (key === "technologies") backup.technologies = (p.technologies ?? []).map((t: { name: string }) => t.name);
        else backup[key] = p[key] ?? null;
      }
      const backupDir = path.join(HERE, "backups");
      fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `${meta.slug}-${Date.now()}.json`);
      try {
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
      } catch (err) {
        throw new Error(`${meta.slug}: failed writing backup to ${backupPath}: ${err}`);
      }

      const data: Record<string, unknown> = {};
      if (changedTop.has("title")) data.title = meta.title;
      if (changedTop.has("description")) data.description = meta.description;
      if (changedTop.has("technologies")) data.technologies = meta.technologies.map((name) => ({ name }));
      if (changedTop.has("live_url")) data.live_url = meta.live_url ?? null;
      if (changedTop.has("featured")) data.featured = true;
      if (changedTop.has("featured_order")) data.featured_order = sheetSrc.featured_order;
      if (changedTop.has("sheet")) data.sheet = wantSheet;
      if (changedTop.has("drawing")) data.drawing = wantDrawing;
      if (SYNC_CONTENT && changedTop.has("content")) data.content = content;

      // Never pass _status — a sync must not change publication state.
      await payload.update({ collection: "projects", id: p.id, data });
      console.log(`  updated: ${[...changedTop].join(", ")} (backup: ${path.relative(HERE, backupPath)})`);
    }
    console.log("");
    continue;
  }

  console.log(`${meta.slug}  (start_date ${cs.start_date}, ${content.length} chars of content)`);

  const imageIds: (number | null)[] = [];
  for (const [filename, alt] of cs.images) imageIds.push(await ensureMedia(filename, alt));

  const data = {
    title: meta.title,
    slug: meta.slug,
    description: meta.description,
    content,
    technologies: meta.technologies.map((name) => ({ name })),
    category: categoryId,
    featured: true,
    featured_order: sheetSrc.featured_order,
    live_url: meta.live_url ?? null,
    start_date: cs.start_date,
    sheet: wantSheet,
    drawing: wantDrawing,
    cover_image: imageIds[0],
    gallery: imageIds.slice(1).filter((id): id is number => id !== null),
    // Without this the row is a draft and every public query filters it out.
    _status: "published" as const,
  };

  if (!EXECUTE) {
    console.log(`  project WOULD create\n`);
    continue;
  }
  const doc = await payload.create({ collection: "projects", data });
  console.log(`  project create #${doc.id} _status=${doc._status}\n`);
}

/* --------------------------------------------------------- unfeaturing -- */

const keep = new Set(newSlugs);
const all = await payload.find({ collection: "projects", limit: 500, depth: 0 });
console.log(`currently featured (${all.docs.filter((p) => p.featured).length} of ${all.docs.length} projects):`);
for (const p of all.docs.filter((d) => d.featured)) console.log(`  ${p.slug}`);
console.log("");

for (const p of all.docs) {
  if (keep.has(p.slug) || !p.featured) continue;
  const safe = await draftSafe(p.slug, p.id, p._status);
  if (!safe) continue;
  if (!EXECUTE) {
    console.log(`unfeature WOULD ${p.slug} (#${p.id}) _status=${p._status}`);
    continue;
  }
  // Never pass _status here — unfeaturing must not change publication state.
  await payload.update({
    collection: "projects",
    id: p.id,
    data: { featured: false },
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
  console.log("  npx payload run scripts/import-case-studies.ts -- --content --execute");
  console.log("  (the bare -- is required, or the flags never reach this script)");
  console.log("  (in PowerShell, npx drops the bare --; use node_modules\\.bin\\payload.cmd instead)");
}

process.exit(0);
