/**
 * Payload-backed data layer.
 * Returns objects in the same shape the Strapi client used to return
 * (types from @/lib/strapi/types), so page-level transforms and fallback
 * logic stay unchanged. Media URLs are returned as-is: app-relative
 * (/api/media/file/...) in dev, absolute Blob/Cloudinary URLs in prod.
 */
import config from "@payload-config";
import { getPayload } from "payload";

import type {
  About,
  BlogPost,
  Category,
  Project,
  StrapiMedia,
} from "@/lib/strapi/types";

async function cms() {
  return getPayload({ config });
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function toMedia(m: any): StrapiMedia | null {
  if (!m || typeof m !== "object" || !m.url) return null;
  return {
    id: m.id,
    documentId: String(m.id),
    name: m.filename ?? "",
    alternativeText: m.alt ?? null,
    caption: null,
    width: m.width ?? 0,
    height: m.height ?? 0,
    formats: null,
    url: m.url,
  };
}

function toCategory(c: any): Category | null {
  if (!c || typeof c !== "object") return null;
  return {
    id: c.id,
    documentId: String(c.id),
    name: c.name,
    slug: c.slug,
    type: c.type,
    description: c.description ?? null,
    color: c.color ?? null,
  };
}

function toProject(doc: any): Project {
  return {
    id: doc.id,
    documentId: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? "",
    content: doc.content ?? null,
    cover_image: toMedia(doc.cover_image),
    gallery: Array.isArray(doc.gallery)
      ? (doc.gallery.map(toMedia).filter(Boolean) as StrapiMedia[])
      : null,
    technologies: (doc.technologies ?? []).map((t: any) => t.name),
    category: toCategory(doc.category),
    featured: !!doc.featured,
    featured_order: doc.featured_order ?? null,
    live_url: doc.live_url ?? null,
    github_url: doc.github_url ?? null,
    start_date: doc.start_date ?? null,
    end_date: doc.end_date ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    publishedAt: doc.createdAt,
  };
}

function toBlogPost(doc: any): BlogPost {
  return {
    id: doc.id,
    documentId: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? "",
    content: doc.content ?? "",
    cover_image: toMedia(doc.cover_image),
    category: toCategory(doc.category),
    tags: (doc.tags ?? []).map((t: any) => t.name),
    published_date: doc.published_date,
    reading_time: doc.reading_time ?? null,
    featured: !!doc.featured,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    publishedAt: doc.createdAt,
  };
}

// Drafts live in the same table with _status='draft'; the public site must
// only ever serve published documents (matching old Strapi semantics).
const publishedOnly = { _status: { equals: "published" } };

export async function cmsProjects(
  opts: { featured?: boolean; limit?: number } = {}
): Promise<Project[]> {
  const payload = await cms();
  const res = await payload.find({
    collection: "projects",
    where: {
      and: [
        publishedOnly,
        ...(opts.featured ? [{ featured: { equals: true } }] : []),
      ],
    },
    sort: ["-featured", "-start_date", "-createdAt"],
    limit: opts.limit ?? 100,
    depth: 1,
  });
  return res.docs.map(toProject);
}

export async function cmsProjectBySlug(slug: string): Promise<Project | null> {
  const payload = await cms();
  const res = await payload.find({
    collection: "projects",
    where: { and: [publishedOnly, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ? toProject(res.docs[0]) : null;
}

export async function cmsBlogPosts(
  opts: { limit?: number; excludeSlug?: string } = {}
): Promise<BlogPost[]> {
  const payload = await cms();
  const res = await payload.find({
    collection: "blog-posts",
    where: {
      and: [
        publishedOnly,
        ...(opts.excludeSlug
          ? [{ slug: { not_equals: opts.excludeSlug } }]
          : []),
      ],
    },
    sort: "-published_date",
    limit: opts.limit ?? 100,
    depth: 1,
  });
  return res.docs.map(toBlogPost);
}

export async function cmsBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const payload = await cms();
  const res = await payload.find({
    collection: "blog-posts",
    where: { and: [publishedOnly, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ? toBlogPost(res.docs[0]) : null;
}

export async function cmsCategories(
  kind: "project" | "blog"
): Promise<Category[]> {
  const payload = await cms();
  const res = await payload.find({
    collection: "categories",
    where: { type: { in: [kind, "both"] } },
    sort: "name",
    limit: 100,
  });
  return res.docs.map(toCategory).filter(Boolean) as Category[];
}

export async function cmsAbout(): Promise<About | null> {
  const payload = await cms();
  const doc: any = await payload.findGlobal({ slug: "about" });
  if (!doc || !doc.name) return null;
  return {
    id: doc.id ?? 1,
    documentId: "about",
    name: doc.name,
    headline: doc.headline ?? "",
    bio_short: doc.bio_short ?? "",
    bio_full: doc.bio_full ?? null,
    avatar: toMedia(doc.avatar),
    resume_url: doc.resume_url ?? null,
    location: doc.location ?? null,
    available_for_work: !!doc.available_for_work,
    skills: (doc.skills ?? []).map((s: any, i: number) => ({
      id: i + 1,
      name: s.name,
      category: s.category ?? "other",
      proficiency: s.proficiency ?? null,
      icon: s.icon ?? null,
    })),
    experience: (doc.experience ?? []).map((e: any, i: number) => ({
      id: i + 1,
      company: e.company,
      position: e.position,
      description: e.description ?? null,
      start_date: e.start_date,
      end_date: e.end_date ?? null,
      is_current: !!e.is_current,
      location: e.location ?? null,
      company_url: e.company_url ?? null,
    })),
    education: (doc.education ?? []).map((e: any, i: number) => ({
      id: i + 1,
      institution: e.institution,
      degree: e.degree,
      field: e.field ?? null,
      start_date: e.start_date ?? null,
      end_date: e.end_date ?? null,
      description: e.description ?? null,
    })),
  };
}
