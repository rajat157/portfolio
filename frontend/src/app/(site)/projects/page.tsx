import { Metadata } from "next";
import Link from "next/link";
import { cmsProjects } from "@/lib/cms";
import { FALLBACK_EARLIER, FALLBACK_SHEETS, type FallbackEarlierProject, type FallbackSheet } from "@/lib/cms/fallback";
import { Project } from "@/lib/cms/types";
import type { Drawing } from "@/lib/drawing";
import { WorksIndex, type SheetRow } from "@/components/works-index";
import { stackCell } from "@/lib/sheet-format";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description: "Four sheets, each drawn 1:1 from the real architecture, plus the earlier work.",
};

// decisions-taken-by-default #3: the index's "For"/"Kind" text is the part
// before " — " in the sheet field (the full text stays in the sheet's title block).
function shortText(s: string | null | undefined): string {
  return (s ?? "").split(" — ")[0];
}

function toSheetRow(p: Project, i: number, total: number): SheetRow {
  return {
    slug: p.slug,
    shortTitle: p.sheet?.short_title || p.title,
    forText: shortText(p.sheet?.client),
    kindText: shortText(p.sheet?.kind),
    technologies: p.technologies ?? [],
    drawing: p.drawing as Drawing,
    oneLiner: p.description,
    sheetNo: i + 1,
    total,
  };
}

function toSheetRowFromFallback(s: FallbackSheet, i: number, total: number): SheetRow {
  return {
    slug: s.slug,
    shortTitle: s.sheet.short_title || s.title,
    forText: shortText(s.sheet.client),
    kindText: shortText(s.sheet.kind),
    technologies: s.technologies,
    drawing: s.drawing as Drawing,
    oneLiner: s.description,
    sheetNo: i + 1,
    total,
  };
}

type EarlierRow = { slug: string; title: string; year: string; category: string; technologies: string[] };

function toEarlierRow(p: Project): EarlierRow {
  const dateStr = p.start_date ?? p.end_date ?? p.createdAt;
  return {
    slug: p.slug,
    title: p.title,
    year: dateStr ? String(new Date(dateStr).getFullYear()) : "—",
    category: p.category?.name ?? "",
    technologies: p.technologies ?? [],
  };
}

function toEarlierRowFromFallback(p: FallbackEarlierProject): EarlierRow {
  return { slug: p.slug, title: p.title, year: "—", category: p.category, technologies: p.technologies };
}

async function getProjects(): Promise<Project[]> {
  try {
    return await cmsProjects();
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  const featuredDocs = projects.filter((p) => p.featured && p.sheet && p.drawing);
  // everything that isn't drawn as a sheet, so a featured project missing its sheet or drawing still lists
  const earlierDocs = projects.filter((p) => !featuredDocs.includes(p));

  const sheets: SheetRow[] =
    featuredDocs.length > 0
      ? featuredDocs.map((p, i) => toSheetRow(p, i, featuredDocs.length))
      : FALLBACK_SHEETS.map((s, i) => toSheetRowFromFallback(s, i, FALLBACK_SHEETS.length));

  const earlier: EarlierRow[] =
    projects.length > 0 ? earlierDocs.map(toEarlierRow) : FALLBACK_EARLIER.map(toEarlierRowFromFallback);

  return (
    <>
      <section className="works" id="works" aria-labelledby="works-h">
        <div className="container gv">
          <div className="sec-head">
            <h1 id="works-h" className="t-h2" data-cons="text">
              Index of works
            </h1>
            <p className="lab">{sheets.length} sheets · each drawing is the real architecture</p>
          </div>
          <WorksIndex sheets={sheets} />
        </div>
      </section>

      <section id="earlier" aria-labelledby="earlier-h">
        <div className="container gv">
          <div className="sec-head">
            <h2 id="earlier-h" className="t-h2" data-cons="text">
              Earlier works
            </h2>
            <p className="lab">{earlier.length} projects</p>
          </div>
          <table className="idx">
            <caption className="sr-only">Earlier works. Each project links to its page.</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Project</th>
                <th scope="col" className="k">Kind</th>
                <th scope="col" className="st">Stack</th>
              </tr>
            </thead>
            <tbody>
              {earlier.map((p) => (
                <tr className="prow" key={p.slug}>
                  <td className="sh">{p.year}</td>
                  <th scope="row">
                    <Link className="rowbtn" href={`/projects/${p.slug}`}>
                      {p.title}
                    </Link>
                  </th>
                  <td className="k" data-fact>{p.category}</td>
                  <td className="st" data-fact>{stackCell(p.technologies)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
