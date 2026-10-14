"use client";

// A sheet's architecture figure. SSR/no-JS renders it inked at the canonical
// width (848px, §3.2's "sheet" options for innerWidth >= 720) — identical to
// this component's first client render, so there's no hydration mismatch.
// After mount it measures its real box (and the window resize), redraws at
// that width, and replays the drafting animation (D9) unless the visitor
// prefers reduced motion.
// See design/drafted/BUILD-PLAN.md §3.2 ("Options") and §4.6.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawLayout, type Drawing } from "@/lib/drawing";
import { DrawingView } from "./drawing-view";

const SSR_WIDTH = 848;

function sheetOpts(w: number) {
  const small = w < 720;
  return { fs: small ? 13 : 15, efs: small ? 10 : 11, nfs: small ? 10 : 11, H: small ? 470 : 540, notes: true };
}

export function SheetFigure({
  drawing,
  project,
  ariaLabel,
}: {
  drawing: Drawing;
  project: string;
  ariaLabel: string;
}) {
  const [w, setW] = useState(SSR_WIDTH);
  const roRef = useRef<ResizeObserver | null>(null);

  const boxRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!el) return;
    const measure = () => {
      const cw = Math.floor(el.getBoundingClientRect().width);
      if (cw > 0) setW(cw);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    roRef.current = ro;
  }, []);

  const { W, H, marks, end } = useMemo(() => drawLayout(drawing, { W: w, ...sheetOpts(w) }), [drawing, w]);

  const [drafting, setDrafting] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raf = requestAnimationFrame(() => setDrafting(true));
    const t = setTimeout(() => setDrafting(false), end + 34);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [W, H, end]);

  return (
    <div className="fig-box" ref={boxRef}>
      <DrawingView W={W} H={H} marks={marks} project={project} ariaLabel={ariaLabel} drafting={drafting} />
    </div>
  );
}
