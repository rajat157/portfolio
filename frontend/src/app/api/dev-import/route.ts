/**
 * Dev-only one-shot content import into Payload.
 * Sources: src/migration/seed-data (raw markdown, Jan 2026) merged with
 * src/migration/snapshot-* (live-site state captured 2026-06-12).
 * Merge policy: snapshot wins for card-level fields (title, description,
 * technologies, category, live_url, cover); seed wins for raw markdown
 * content and the dates/featured flags only it has. Idempotent (upserts).
 *
 * Run: curl -X POST http://localhost:3000/api/dev-import
 */
import fs from "fs";
import os from "os";
import path from "path";

import config from "@payload-config";
import { getPayload } from "payload";

import { projects as seedProjects } from "@/migration/seed-data/projects";
import { blogPosts as seedBlogPosts } from "@/migration/seed-data/blog-posts";
import { categories as seedCategories } from "@/migration/seed-data/categories";
import { aboutData as seedAbout } from "@/migration/seed-data/about";
import { siteSettings as seedSiteSettings } from "@/migration/seed-data/site-settings";

import listing from "@/migration/snapshot-projects-listing.json";
import aboutSnapshot from "@/migration/snapshot-about.json";

const categoryNameToSlug: Record<string, string> = {
  "Web Dev": "web-dev",
  Backend: "backend",
  DevOps: "devops",
  Architecture: "architecture",
  AI: "ai",
};

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

function parseMonthYear(s: string | null | undefined): string | null {
  if (!s || /present/i.test(s)) return null;
  const m = s.trim().match(/^([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if (!m) return null;
  return `${m[2]}-${MONTHS[m[1].slice(0, 3)] ?? "01"}-01`;
}

function readSnapshotProject(slug: string) {
  const p = path.join(
    process.cwd(),
    "src",
    "migration",
    "snapshot-projects",
    `${slug}.json`
  );
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "dev only" }, { status: 403 });
  }

  const log: string[] = [];
  const payload = await getPayload({ config });

  // ---------- categories ----------
  const categoryIds: Record<string, number> = {};
  for (const cat of seedCategories) {
    const existing = await payload.find({
      collection: "categories",
      where: { slug: { equals: cat.slug } },
      limit: 1,
    });
    const data = {
      name: cat.name,
      slug: cat.slug,
      type: cat.type,
      description: cat.description,
      color: cat.color,
    };
    const doc = existing.docs[0]
      ? await payload.update({
          collection: "categories",
          id: existing.docs[0].id,
          data,
        })
      : await payload.create({ collection: "categories", data });
    categoryIds[cat.slug] = doc.id as number;
    log.push(`category upserted: ${cat.slug} (#${doc.id})`);
  }

  // ---------- media ----------
  const mediaCache = new Map<string, number>();
  async function importMediaFromUrl(
    url: string | null | undefined,
    alt: string
  ): Promise<number | null> {
    if (!url) return null;
    if (mediaCache.has(url)) return mediaCache.get(url)!;

    const filename = decodeURIComponent(
      new URL(url).pathname.split("/").pop() || "file"
    );
    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
    });
    if (existing.docs[0]) {
      mediaCache.set(url, existing.docs[0].id as number);
      return existing.docs[0].id as number;
    }

    const res = await fetch(url);
    if (!res.ok) {
      log.push(`! media download failed (${res.status}): ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    // Payload stores the basename of filePath as the document filename, so
    // keep the original name (in a unique temp dir) or dedupe never matches.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "payload-import-"));
    const tmp = path.join(tmpDir, filename);
    fs.writeFileSync(tmp, buf);
    try {
      const doc = await payload.create({
        collection: "media",
        data: { alt },
        filePath: tmp,
      });
      mediaCache.set(url, doc.id as number);
      log.push(`media imported: ${filename} (#${doc.id})`);
      return doc.id as number;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  // The real blog cover images live only in the quota-locked legacy Strapi DB;
  // until that export, use the designed SVG covers shipped in public/.
  async function importMediaFromPublic(
    relPath: string,
    alt: string
  ): Promise<number | null> {
    const abs = path.join(process.cwd(), "public", relPath);
    if (!fs.existsSync(abs)) return null;
    const filename = path.basename(abs);
    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
    });
    if (existing.docs[0]) return existing.docs[0].id as number;
    const doc = await payload.create({
      collection: "media",
      data: { alt },
      filePath: abs,
    });
    log.push(`media imported from public/: ${filename} (#${doc.id})`);
    return doc.id as number;
  }

  // ---------- projects ----------
  type ListingEntry = {
    slug: string;
    title: string;
    description: string;
    category: string;
    technologies_preview: string[];
    cover_image_url: string | null;
  };
  const listingBySlug = new Map<string, ListingEntry>(
    (listing.projects as ListingEntry[]).map((p) => [p.slug, p])
  );
  const seedBySlug = new Map(seedProjects.map((p) => [p.slug, p]));
  const allSlugs = [...new Set([...seedBySlug.keys(), ...listingBySlug.keys()])];

  for (const slug of allSlugs) {
    const seed = seedBySlug.get(slug);
    const detail = readSnapshotProject(slug);
    const card = listingBySlug.get(slug);

    const title = detail?.title ?? card?.title ?? seed?.title ?? slug;
    const technologies: string[] = detail?.technologies?.length
      ? detail.technologies
      : seed?.technologies ?? card?.technologies_preview ?? [];
    const categorySlug =
      categoryNameToSlug[detail?.category ?? card?.category ?? ""] ??
      seed?.categorySlug ??
      null;
    const coverUrl = card?.cover_image_url ?? detail?.cover_image_url ?? null;
    const coverId = await importMediaFromUrl(coverUrl, title);

    const data = {
      title,
      slug,
      description:
        detail?.description ?? card?.description ?? seed?.description ?? "",
      content: seed?.content ?? detail?.content_markdown ?? null,
      technologies: technologies.map((name) => ({ name })),
      category: categorySlug ? categoryIds[categorySlug] : null,
      featured: seed?.featured ?? false,
      featured_order: seed?.featured_order ?? null,
      live_url: detail?.live_url ?? seed?.live_url ?? null,
      github_url: seed?.github_url ?? detail?.github_url ?? null,
      start_date: seed?.start_date ?? null,
      end_date: seed?.end_date ?? null,
      cover_image: coverId,
      _status: "published" as const,
    };

    const existing = await payload.find({
      collection: "projects",
      where: { slug: { equals: slug } },
      limit: 1,
      draft: true,
    });
    const doc = existing.docs[0]
      ? await payload.update({
          collection: "projects",
          id: existing.docs[0].id,
          data,
        })
      : await payload.create({ collection: "projects", data });
    log.push(
      `project upserted: ${slug} (#${doc.id}) [seed=${!!seed} detail=${!!detail} card=${!!card}]`
    );
  }

  // ---------- blog posts ----------
  for (const post of seedBlogPosts) {
    const coverId = await importMediaFromPublic(
      path.join("images", "covers", `${post.slug}.svg`),
      post.title
    );
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      cover_image: coverId,
      category: categoryIds[post.categorySlug] ?? null,
      tags: post.tags.map((name) => ({ name })),
      published_date: post.published_date,
      reading_time: post.reading_time,
      featured: post.featured,
      _status: "published" as const,
    };
    const existing = await payload.find({
      collection: "blog-posts",
      where: { slug: { equals: post.slug } },
      limit: 1,
      draft: true,
    });
    const doc = existing.docs[0]
      ? await payload.update({
          collection: "blog-posts",
          id: existing.docs[0].id,
          data,
        })
      : await payload.create({ collection: "blog-posts", data });
    log.push(`blog post upserted: ${post.slug} (#${doc.id})`);
  }

  // ---------- about global ----------
  type SnapshotExperience = {
    company: string;
    position: string;
    description: string;
    start_date: string;
    end_date: string;
  };
  const experience = (aboutSnapshot.experience as SnapshotExperience[])?.length
    ? (aboutSnapshot.experience as SnapshotExperience[]).map((e) => ({
        company: e.company,
        position: e.position,
        description: e.description,
        start_date: parseMonthYear(e.start_date) ?? "2020-01-01",
        end_date: parseMonthYear(e.end_date),
        is_current: /present/i.test(e.end_date ?? ""),
      }))
    : seedAbout.experience.map((e) => ({
        company: e.company,
        position: e.position,
        description: e.description,
        start_date: e.start_date,
        end_date: e.end_date,
        is_current: e.is_current,
        location: e.location,
        company_url: e.company_url,
      }));

  await payload.updateGlobal({
    slug: "about",
    data: {
      name: aboutSnapshot.name ?? seedAbout.name,
      headline: aboutSnapshot.headline ?? seedAbout.headline,
      bio_short: seedAbout.bio_short,
      bio_full: seedAbout.bio_full,
      resume_url: aboutSnapshot.resume_url ?? seedAbout.resume_url,
      location: aboutSnapshot.location ?? seedAbout.location,
      available_for_work: seedAbout.available_for_work,
      skills: seedAbout.skills.map((s) => ({
        name: s.name,
        category: s.category,
        proficiency: s.proficiency,
      })),
      experience,
      education: seedAbout.education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        start_date: e.start_date,
        end_date: e.end_date,
        description: e.description,
      })),
    },
  });
  log.push("about global updated");

  // ---------- site settings global ----------
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      site_title: seedSiteSettings.site_title,
      site_description: seedSiteSettings.site_description,
      site_url: "https://rajatkumarr.com",
      social_links: seedSiteSettings.social_links.map((l) => ({
        platform: l.platform,
        url: l.url,
        label: l.label,
      })),
      newsletter_enabled: seedSiteSettings.newsletter_enabled,
    },
  });
  log.push("site-settings global updated");

  return Response.json({ ok: true, log });
}
