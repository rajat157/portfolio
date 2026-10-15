/**
 * Hardcoded fallback content for when the DB returns nothing (CLAUDE.md:
 * "Pages keep hardcoded fallback content... preserve this pattern"). One
 * source for the 4 featured sheets — sheets.json (D18) — plus the existing
 * "earlier works" and blog fallbacks, carried forward unchanged.
 *
 * FALLBACK_EARLIER is the non-case-study entries already hardcoded in
 * projects/page.tsx (minus Tredye, now a featured sheet, and minus
 * imageUrl). Note: BUILD-PLAN.md §3.4 describes this as "8" entries, but
 * the page's existing hardcoded list only ever had 5 non-case-study
 * projects; this keeps that existing list rather than inventing 3 more
 * that no fallback has ever shown.
 */
import { parseDrawing, type Drawing } from "@/lib/drawing";
import sheetsJson from "@/migration/case-studies/sheets.json";
import type { Sheet } from "./types";

type RawSheetEntry = {
  featured_order: number;
  description: string;
  technologies: string[];
  sheet: Sheet;
  drawing: unknown;
};

// Imported, not read with fs: the import is bundled into the server chunk, while a runtime read of a source-tree
// path isn't in the deployed function's file traces, so ISR regeneration would fail with ENOENT on Vercel.
const raw: Record<string, RawSheetEntry> = sheetsJson;

export type FallbackSheet = {
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  live_url: string | null;
  sheet: Sheet;
  drawing: Drawing | null;
};

// title/live_url mirror each case study's md header (scripts/import-case-studies.ts
// asserts description/technologies stay in sync with those headers; title and
// live_url are copied here directly since this file never re-parses the md).
const SHEET_META: Record<string, { title: string; live_url: string | null }> = {
  "b2b-wholesale-platform": { title: "B2B Wholesale Platform — Buyer Portal, CRM & CMS in One App", live_url: "https://www.offpriced.com" },
  "staffing-operations-platform": { title: "Staffing Operations Platform — Five Portals on One System", live_url: null },
  "esports-talent-portfolio": { title: "Esports Talent Portfolio — Broadcast-Style Motion & a Custom Control Room", live_url: "https://lucif3r.1v1clutch.com" },
  "tredye-trading-platform": { title: "Tredye — Real-Time NSE Market Monitoring on an Event-Driven Stack", live_url: "https://tredye.com" },
};

export const FALLBACK_SHEETS: FallbackSheet[] = Object.entries(raw)
  .sort(([, a], [, b]) => a.featured_order - b.featured_order)
  .map(([slug, s]) => ({
    slug,
    title: SHEET_META[slug].title,
    description: s.description,
    technologies: s.technologies,
    live_url: SHEET_META[slug].live_url,
    sheet: s.sheet,
    drawing: parseDrawing(s.drawing),
  }));

export type FallbackEarlierProject = {
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  category: string;
};

// The pre-existing hardcoded fallback (projects/page.tsx), minus Tredye
// (now featured, §3.4) and minus imageUrl (no cover images on /projects, D-summary).
export const FALLBACK_EARLIER: FallbackEarlierProject[] = [
  {
    slug: "labbuild-2",
    title: "Labbuild 2.0",
    description: "High-performance lab infrastructure system achieving 90% faster performance. Rebuilt from ground up with modern Python stack.",
    technologies: ["Python", "Flask", "FastAPI", "MongoDB"],
    category: "Backend",
  },
  {
    slug: "supercomputer-dashboard",
    title: "Supercomputer Dashboard",
    description: "Django dashboard for monitoring SahasraT supercomputer at IISc with 33,000 cores. Real-time job tracking and resource monitoring.",
    technologies: ["Django", "Python", "Linux", "HPC", "SLURM"],
    category: "DevOps",
  },
  {
    slug: "labbuild-dashboard",
    title: "Labbuild Dashboard",
    description: "Internal monitoring dashboard for Labbuild infrastructure. Real-time metrics, user sessions, and system health monitoring.",
    technologies: ["Flask", "MongoDB", "Chart.js", "Bootstrap"],
    category: "Backend",
  },
  {
    slug: "operation-schedules",
    title: "Operation Schedules",
    description: "Automated workflow scheduling system for batch operations. Handles complex dependencies and parallel execution.",
    technologies: ["FastAPI", "Celery", "Redis", "PostgreSQL"],
    category: "Backend",
  },
  {
    slug: "pro-fit-club-dashboard",
    title: "Pro Fit Club Dashboard",
    description: "Fitness club management dashboard with member tracking, class scheduling, and revenue analytics.",
    technologies: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
    category: "Web Dev",
  },
];

export type FallbackPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  publishedAt: string;
};

// Carried forward unchanged from blog/page.tsx's defaultArticles.
export const FALLBACK_POSTS: FallbackPost[] = [
  {
    slug: "building-real-time-trading-platforms",
    title: "Building a Real-Time Market Monitoring Platform",
    excerpt: "Lessons from building Tredye, real-time market monitoring on an event-driven stack.",
    category: "Architecture",
    readingTime: 8,
    publishedAt: "2026-01-15",
  },
  {
    slug: "ai-accelerated-development",
    title: "AI-Accelerated Development",
    excerpt: "How I use Claude and Gemini to 10x my development productivity. Practical tips and workflow optimizations.",
    category: "AI",
    readingTime: 5,
    publishedAt: "2026-01-10",
  },
  {
    slug: "managing-supercomputers",
    title: "Managing India's Fastest Supercomputer",
    excerpt: "My experience managing SahasraT at IISc with 33,000 cores. SLURM job scheduling, monitoring, and performance optimization.",
    category: "DevOps",
    readingTime: 12,
    publishedAt: "2026-01-05",
  },
];
