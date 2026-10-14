import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cmsProjects, cmsProjectBySlug, getMediaURL } from "@/lib/cms";
import { Project } from "@/lib/cms/types";
import { describe } from "@/lib/drawing";
import { pad2 } from "@/lib/sheet-format";
import { SheetFigure } from "@/components/sheet-figure";
import { SheetKeys } from "@/components/sheet-keys";
import { PenBlocks } from "@/components/reveal";
import { Markdown } from "@/components/markdown";
import { GalleryVideo } from "@/components/gallery-video";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    return await cmsProjectBySlug(slug);
  } catch (error) {
    console.error(`Failed to fetch project with slug "${slug}":`, error);
    return null;
  }
}

async function getAllProjects(): Promise<Project[]> {
  try {
    return await cmsProjects();
  } catch (error) {
    console.error("Failed to fetch all projects:", error);
    return [];
  }
}

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.filter((p) => p?.slug).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Sheet not found" };

  const description = project.description?.slice(0, 160) || "";
  const cover = project.cover_image;
  return {
    title: project.sheet?.short_title || project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "article",
      images: cover
        ? [{ url: getMediaURL(cover.url) || "", width: cover.width, height: cover.height, alt: cover.alternativeText || project.title }]
        : [],
    },
  };
}

export default async function ProjectSheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  // the index's rule: only a featured project with a sheet and a drawing is numbered as a sheet
  const isSheet = !!(project.featured && project.sheet && project.drawing);
  let sheetNo = 0;
  let total = 0;
  if (isSheet) {
    const all = await getAllProjects();
    const featured = all.filter((p) => p.featured && p.sheet && p.drawing);
    sheetNo = featured.findIndex((p) => p.slug === slug) + 1;
    total = featured.length;
  }

  const shortTitle = project.sheet?.short_title || project.title;
  const ariaLabel = isSheet && project.drawing ? describe(project.drawing, shortTitle) : "";
  const gallery = project.gallery ?? [];
  const figOffset = isSheet ? 2 : 1;

  return (
    <div className="sheet">
      <SheetKeys slug={slug} />
      <div className="sheet-top">
        <Link data-sheet-back href="/projects" className="btn">
          ← Back to index
        </Link>
        <p className="lab">
          {isSheet ? `Sheet ${pad2(sheetNo)} of ${pad2(total)}` : "Earlier work"} · <span className="needs-js">Esc</span>
        </p>
      </div>

      <div className="sheet-grid">
        <div className="sh-head">
          <p className="lab" data-fact>{project.sheet?.kind || project.category?.name || ""}</p>
          <h1 className="sheet-title" id={`t-${slug}`} tabIndex={-1}>
            {shortTitle}
          </h1>
          <p className="sheet-one" data-fact>{project.description}</p>
        </div>

        <aside className="tb" aria-label="Title block">
          <dl>
            {isSheet && (
              <div className="tb-row">
                <dt className="lab">Sheet</dt>
                <dd className="tb-sheet">{pad2(sheetNo)} / {pad2(total)}</dd>
              </div>
            )}
            <div className="tb-row">
              <dt className="lab">Project</dt>
              <dd data-fact>{shortTitle}</dd>
            </div>
            {project.sheet?.client && (
              <div className="tb-row">
                <dt className="lab">For</dt>
                <dd data-fact>{project.sheet.client}</dd>
              </div>
            )}
            <div className="tb-row">
              <dt className="lab">Kind</dt>
              <dd data-fact>{project.sheet?.kind || project.category?.name || ""}</dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Stack</dt>
              <dd data-fact>{(project.technologies ?? []).join(", ")}</dd>
            </div>
            {project.live_url && (
              <div className="tb-row">
                <dt className="lab">Live</dt>
                <dd>
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                    Visit<span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>
          {project.content && (
            <a className="tb-link" href="#case-study">
              <span>Full case study</span>
              <span aria-hidden="true">↓</span>
            </a>
          )}
        </aside>

        {isSheet && project.drawing && (
          <figure className="fig">
            <SheetFigure drawing={project.drawing} project={slug} ariaLabel={ariaLabel} />
            <figcaption>
              <p className="dia-text" data-fact>{ariaLabel}</p>
              <p className="lab fig-cap">Architecture, drawn 1:1</p>
            </figcaption>
          </figure>
        )}
      </div>

      {isSheet && project.sheet && (
        <div className="blocks">
          <PenBlocks>
            <h4 className="blk-h">Problem</h4>
            <div data-fact><p className="ln">{project.sheet.problem}</p></div>
          </PenBlocks>
          <PenBlocks>
            <h4 className="blk-h">What I built</h4>
            <div data-fact>
              <ul>
                {project.sheet.built.map((line, i) => (
                  <li className="ln" key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </PenBlocks>
          <PenBlocks>
            <h4 className="blk-h">Key decisions</h4>
            <div data-fact>
              <ul>
                {project.sheet.decisions.map((line, i) => (
                  <li className="ln" key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </PenBlocks>
          <PenBlocks>
            <h4 className="blk-h">Outcome</h4>
            <div data-fact><p className="ln">{project.sheet.outcome}</p></div>
          </PenBlocks>
        </div>
      )}

      {project.content && (
        <section id="case-study">
          <div className="prose">
            <Markdown content={project.content} headingShift />
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="plates">
          {gallery.map((m, i) => (
            <figure className="plate" key={m.id}>
              {m.mimeType?.startsWith("video/") ? (
                <GalleryVideo src={getMediaURL(m.url) || m.url} label={m.alternativeText || `Gallery video ${i + 1}`} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- plain markup only, no Tailwind/next-image sizing props needed (D11)
                <img src={getMediaURL(m.url) || m.url} alt={m.alternativeText || ""} loading="lazy" width={m.width ?? undefined} height={m.height ?? undefined} />
              )}
              <figcaption>
                <span className="lab">Fig. {pad2(i + figOffset)}</span> <span data-fact>{m.alternativeText || ""}</span>
              </figcaption>
            </figure>
          ))}
        </section>
      )}
    </div>
  );
}
