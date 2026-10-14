"use client";

// Port of drafted.html's construction tools: a toggle that shows the drafting
// guides (:1922-1929), the guides themselves (:1217-1234, :1423-1486), and the
// drafting cursor's coordinate readout (Q6c, design/drafted/BUILD-PLAN.md §4.7).
// All three stay decoupled through `html[data-construction]`, same as the
// prototype — no shared React state needed.

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NS = "http://www.w3.org/2000/svg";

function isShown(): boolean {
  return document.documentElement.dataset.construction === "on";
}

export function ConstructionToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (on) document.documentElement.dataset.construction = "on";
    else delete document.documentElement.dataset.construction;
  }, [on]);

  return (
    <button
      id="consBtn"
      className="toggle needs-js"
      type="button"
      onClick={() => setOn((v) => !v)}
    >
      {/* a set square; its extension lines show while construction is on */}
      <svg className="tg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M5 19V5l14 14z" />
        <path d="M8.5 15.5v-3.5l3.5 3.5z" />
        <path className="ext" d="M5 2v2M2 19h2M19 22v-2M22 19h-2" strokeDasharray="1.5 1.5" />
      </svg>
      <span className="tg-label">{on ? "Hide construction" : "Show construction"}</span>
      <span className="tip" aria-hidden="true">
        {on ? "Hide construction" : "Show construction"}
      </span>
    </button>
  );
}

// Round to a crisp 1px line coordinate, as the prototype's P5() does.
function P5(v: number): number {
  return Math.round(v) + 0.5;
}

function guideGroup(svg: SVGSVGElement, n: HTMLElement): SVGGElement {
  const r = n.getBoundingClientRect();
  const e = 10;
  const x0 = P5(r.left + window.scrollX);
  const x1 = P5(r.right + window.scrollX);
  const y0 = P5(r.top + window.scrollY);
  const y1 = P5(r.bottom + window.scrollY);
  const g = document.createElementNS(NS, "g");

  function line(d: string, cls: string) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("class", cls);
    g.appendChild(p);
  }

  line(`M${x0} ${y0 - e}V${y1 + e}`, "c c-soft");
  line(`M${x1} ${y0 - e}V${y1 + e}`, "c c-soft");
  line(`M${x0 - e} ${y0}H${x1 + e}`, "c c-soft");
  line(`M${x0 - e} ${y1}H${x1 + e}`, "c c-soft");

  // the width dimension line + its numeric px label, on a knockout
  const t = 3.5;
  const labelY = P5(r.top + window.scrollY - 9);
  const cx = (x0 + x1) / 2;
  line(
    `M${x0} ${labelY}H${x1}M${x0 - t} ${labelY + t}L${x0 + t} ${labelY - t}M${x1 - t} ${labelY + t}L${x1 + t} ${labelY - t}`,
    "c"
  );
  const lg = document.createElementNS(NS, "g");
  const knock = document.createElementNS(NS, "rect");
  knock.setAttribute("class", "c-knock");
  const text = document.createElementNS(NS, "text");
  text.setAttribute("class", "c-txt");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("x", String(Math.round(cx)));
  text.setAttribute("y", String(Math.round(labelY + 3.5)));
  text.textContent = String(Math.round(r.width));
  lg.appendChild(knock);
  lg.appendChild(text);
  g.appendChild(lg);
  svg.appendChild(g);

  // size the knockout from the text's real bbox (no canvas measuring needed)
  const bb = text.getBBox();
  knock.setAttribute("x", String(Math.round(bb.x - 4)));
  knock.setAttribute("y", String(Math.round(bb.y - 1)));
  knock.setAttribute("width", String(Math.round(bb.width + 8)));
  knock.setAttribute("height", String(Math.round(bb.height + 2)));

  return g;
}

export function Guides() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const root = document.documentElement;
    let hoverGroup: SVGGElement | null = null;
    let hoverTarget: Element | null = null;

    function size() {
      svg!.setAttribute("height", "0");
      svg!.setAttribute("width", String(root.clientWidth));
      svg!.setAttribute("height", String(root.scrollHeight));
    }

    function clearHover() {
      hoverGroup?.remove();
      hoverGroup = null;
      hoverTarget = null;
    }

    function refresh() {
      clearHover();
      svg!.textContent = "";
      size();
      if (!isShown()) return;
      document.querySelectorAll<HTMLElement>("[data-cons]").forEach((n) => {
        if (n.offsetParent !== null) guideGroup(svg!, n);
      });
    }

    function hover(n: Element | null) {
      if (isShown()) return;
      if (hoverTarget === n) return;
      clearHover();
      if (!(n instanceof HTMLElement)) return;
      size();
      hoverGroup = guideGroup(svg!, n);
      hoverTarget = n;
    }

    function onOver(e: PointerEvent) {
      hover((e.target as Element)?.closest?.("[data-cons]") ?? null);
    }
    function onFocusIn(e: FocusEvent) {
      hover((e.target as Element)?.closest?.("[data-cons]") ?? null);
    }
    function onFocusOut(e: FocusEvent) {
      if (hoverTarget && !(e.relatedTarget && hoverTarget.contains(e.relatedTarget as Node))) clearHover();
    }

    const mo = new MutationObserver(refresh);
    mo.observe(root, { attributes: true, attributeFilter: ["data-construction"] });
    window.addEventListener("resize", refresh);
    document.fonts?.addEventListener?.("loadingdone", refresh);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    refresh();

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", refresh);
      document.fonts?.removeEventListener?.("loadingdone", refresh);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
    // pathname: refresh when client navigation changes which [data-cons] nodes exist
  }, [pathname]);

  return <svg ref={svgRef} id="guides" aria-hidden="true" width="0" height="0" />;
}

// Q6c: the system cursor is never hidden. Construction mode swaps it for a
// native crosshair (CSS, globals.css) and this readout follows it directly —
// no spring, no cursor:none.
export function CursorReadout() {
  const roRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = roRef.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    let visible = false;

    function render() {
      raf = 0;
      el!.style.transform = `translate(${x + 14}px,${y + 14}px)`;
      el!.textContent = visible
        ? `x ${String(Math.round(x)).padStart(4, "0")} · y ${String(Math.round(y)).padStart(4, "0")}`
        : "";
    }

    function onMove(e: PointerEvent) {
      x = e.clientX;
      y = e.clientY;
      const over = (e.target as Element)?.closest?.("a, button, input, textarea, select, label, summary, [contenteditable]");
      visible = isShown() && !over;
      el!.style.visibility = visible ? "visible" : "hidden";
      if (!raf) raf = requestAnimationFrame(render);
    }

    function onLeave() {
      visible = false;
      el!.style.visibility = "hidden";
    }

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={roRef} className="ro" aria-hidden="true" style={{ visibility: "hidden" }} />;
}
