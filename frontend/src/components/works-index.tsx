"use client";

// The works index: a table of the 4 featured sheets, each row drafting its
// architecture into a panel on hover/focus/tap (D1 drops the SPA "inspect"
// modal — the panel only previews; "Open sheet" is a real link to the sheet's
// own route). On narrow/touch viewports the panel renders inline, directly
// under the selected row, instead of beside the table — no DOM reparenting,
// just a conditional render keyed off matchMedia (§4.6).
// Port of drafted.html:385-421 (markup) and :1736-1809 (behaviour).

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { describe, drawLayout, type Drawing } from "@/lib/drawing";
import { pad2, stackCell } from "@/lib/sheet-format";
import { DrawingView } from "./drawing-view";
import { markCameFromIndex } from "./sheet-keys";

export type SheetRow = {
  slug: string;
  shortTitle: string;
  forText: string;
  kindText: string;
  technologies: string[];
  drawing: Drawing;
  oneLiner: string;
  sheetNo: number;
  total: number;
};

const PANEL_OPTS = { fs: 13, efs: 10, nfs: 10, notes: false };

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => false
  );
}

export function WorksIndex({ sheets }: { sheets: SheetRow[] }) {
  const [sel, setSel] = useState(-1);
  const [drafting, setDrafting] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 460 });
  const gridRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<"mouse" | "touch">("mouse");
  const downWasSel = useRef(false);
  // the row the visitor has actually tapped, as opposed to `sel` (which also
  // moves on hover/focus/auto-select) — drafted.html's own userSel/sel split,
  // needed so tapping the already-auto-selected row 0 still counts as a
  // first tap rather than a second one.
  const userSel = useRef(-1);
  const roRef = useRef<ResizeObserver | null>(null);

  // the drawing goes inline under a row only where hover cannot move rows:
  // phones, and touch screens below the side-by-side layout (drafted.html:1742)
  const inline = useMediaQuery("(max-width: 719px), (pointer: coarse) and (max-width: 1199px)");
  const narrow = useMediaQuery("(max-width: 719px)");

  // a callback ref: the panel (and its .dia-box) only exists once a row is
  // selected, so measuring on mount (rather than a `useLayoutEffect` keyed to
  // something that doesn't change when the panel first appears) is what
  // actually catches its first real size.
  const boxRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setBox({ w: Math.floor(r.width), h: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    roRef.current = ro;
  }, []);

  // auto-select row 0 once the index scrolls into view (drafted.html:1983-1986)
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || sel >= 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          setSel(0);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(grid);
    return () => io.disconnect();
  }, [sel]);

  // a first touch-tap drafts a row; bring the drawing fully into view once it
  // has mounted inline, keeping the row clear of the sticky header
  // (drafted.html:1794-1798 — the same shape, without the SPA internals).
  // Called directly after the tap, not from an effect keyed on `sel`: tapping
  // an already-selected row (e.g. the one auto-selected on scroll-in) sets
  // the same state value, which React bails out of re-rendering for, so an
  // effect watching `sel` would never re-run.
  function bringPanelIntoView() {
    if (!inline) return;
    const panelRow = gridRef.current?.querySelector(".panel-row");
    if (!panelRow) return;
    const pr = panelRow.getBoundingClientRect();
    const headerBottom = (document.querySelector(".top")?.getBoundingClientRect().bottom ?? 0) + 8;
    if (pr.bottom > window.innerHeight || pr.top < headerBottom) {
      window.scrollBy(0, Math.min(pr.bottom - window.innerHeight + 12, pr.top - headerBottom));
    }
  }

  const current = sel >= 0 ? sheets[sel] : null;
  const layout = useMemo(
    () => (current && box.w > 0 ? drawLayout(current.drawing, { W: box.w, H: box.h, ...PANEL_OPTS }) : null),
    [current, box.w, box.h]
  );

  useEffect(() => {
    if (!layout) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrafting(false);
      return;
    }
    const raf = requestAnimationFrame(() => setDrafting(true));
    const t = setTimeout(() => setDrafting(false), layout.end + 34);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
    // layout.W/H/end change together with `current`; re-draft on either
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, layout?.end]);

  const ariaLabel = current ? describe(current.drawing, current.shortTitle) : "";

  // the .dia-box renders as soon as a row is selected, whether or not the
  // layout is ready yet — the box's own ref callback is what measures its
  // width and produces that layout, so it can't wait on the layout it
  // produces.
  const panel = current ? (
    <aside className="panel needs-js" aria-labelledby="panel-h">
      <div className="panel-head">
        <p id="panel-h" className="lab">
          Sheet {pad2(current.sheetNo)} · {current.shortTitle}
        </p>
        <p className="lab" aria-hidden="true">
          {layout ? `${layout.W} × ${layout.H} px` : ""}
        </p>
      </div>
      <div className="dia-box" ref={boxRef}>
        {layout && (
          <DrawingView W={layout.W} H={layout.H} marks={layout.marks} project={current.slug} ariaLabel={ariaLabel} drafting={drafting} />
        )}
      </div>
      <div className="panel-foot">
        <p className="panel-cap" data-fact>
          {current.oneLiner}
        </p>
        <Link className="btn" href={`/projects/${current.slug}`} onClick={() => markCameFromIndex()}>
          Open sheet {pad2(current.sheetNo)}
        </Link>
      </div>
    </aside>
  ) : null;

  return (
    <div className="works-grid" ref={gridRef}>
      <div className="tbl-wrap">
        <table className="idx">
          <caption className="sr-only">Index of works. Each project links to its sheet.</caption>
          <thead>
            <tr>
              <th scope="col">Sheet</th>
              <th scope="col">Project</th>
              <th scope="col">For</th>
              <th scope="col" className="k">Kind</th>
              <th scope="col" className="st">Stack</th>
            </tr>
          </thead>
          <tbody id="rows">
            {sheets.map((s, i) => (
              <Row
                key={s.slug}
                s={s}
                selected={sel === i}
                inline={inline}
                narrow={narrow}
                panel={sel === i ? panel : null}
                onHover={() => setSel(i)}
                onFocus={() => setSel(i)}
                onPointerDown={(pointerType) => {
                  lastPointer.current = pointerType;
                  downWasSel.current = userSel.current === i;
                }}
                onRowClick={() => {
                  if (lastPointer.current === "touch" && !downWasSel.current) return "draft";
                  userSel.current = i;
                  markCameFromIndex();
                  return "navigate";
                }}
                onDraft={() => {
                  userSel.current = i;
                  setSel(i);
                  requestAnimationFrame(bringPanelIntoView);
                }}
              />
            ))}
          </tbody>
        </table>
        <div className="key needs-js">
          <p className="lab">Drawing key</p>
          <ul>
            <li>
              <svg width="40" height="14" aria-hidden="true">
                <path className="c" d="M0 7.5H40M20.5 1V14" />
              </svg>
              <span>Construction: guides and real measurements, in px</span>
            </li>
            <li>
              <svg width="40" height="14" aria-hidden="true">
                <rect className="d-box" x="1" y="1.5" width="38" height="11" />
              </svg>
              <span>A part of the system, as built</span>
            </li>
            <li>
              <svg width="40" height="14" aria-hidden="true">
                <path className="d-edge" d="M0 7.5H34" />
                <path className="d-arrow" d="M40 7.5L32 4V11Z" />
              </svg>
              <span>Direction of data or requests</span>
            </li>
            <li>
              <svg width="40" height="14" aria-hidden="true">
                <path
                  className="d-wall"
                  d="M0 3.5H40M0 10.5H40M2 10L8 4M8 10L14 4M14 10L20 4M20 10L26 4M26 10L32 4M32 10L38 4"
                />
              </svg>
              <span>Wall: data kept apart inside the database</span>
            </li>
          </ul>
        </div>
      </div>
      {!inline && panel}
    </div>
  );
}

function Row({
  s,
  selected,
  inline,
  narrow,
  panel,
  onHover,
  onFocus,
  onPointerDown,
  onRowClick,
  onDraft,
}: {
  s: SheetRow;
  selected: boolean;
  inline: boolean;
  narrow: boolean;
  panel: ReactNode;
  onHover: () => void;
  onFocus: () => void;
  onPointerDown: (pointerType: "mouse" | "touch") => void;
  /** Decides, on a row click, whether this is a first touch-tap (draft only) or a real activation (navigate). */
  onRowClick: () => "draft" | "navigate";
  onDraft: () => void;
}) {
  return (
    <>
      <tr
        className={selected ? "prow sel" : "prow"}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") onHover();
        }}
        onFocus={onFocus}
        onPointerDown={(e) => onPointerDown(e.pointerType as "mouse" | "touch")}
        onClickCapture={(e) => {
          // capture phase: runs before the rowbtn link's own click handling,
          // so preventDefault here stops Next's <Link> navigation too —
          // whichever cell in the row was actually tapped (drafted.html's
          // row-wide listeners, ported to a capture-phase ancestor handler
          // instead of reparenting DOM nodes).
          if (onRowClick() === "draft") {
            e.preventDefault();
            onDraft();
          }
        }}
      >
        <td className="sh">{pad2(s.sheetNo)}</td>
        <th scope="row">
          <Link className="rowbtn" href={`/projects/${s.slug}`}>
            {s.shortTitle}
          </Link>
        </th>
        <td data-fact>{s.forText}</td>
        <td className="k" data-fact>{s.kindText}</td>
        <td className="st" data-fact>{stackCell(s.technologies)}</td>
      </tr>
      {inline && panel && (
        <tr className="panel-row">
          <td colSpan={narrow ? 2 : 5}>{panel}</td>
        </tr>
      )}
    </>
  );
}
