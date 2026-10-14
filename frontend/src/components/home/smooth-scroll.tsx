"use client";

// PROTOTYPE (proto/smooth-snap, not for merge): Lenis smooth scroll + proximity
// snapping to the home page's section stops. Off under reduced motion. Snap
// points are the hero's (#exp) story-step centres and the chapters' (#who)
// per-stop centres -- the same fractions/positions those sections' own
// engines (stage.tsx, steps.tsx) already use -- plus #map and #contact.
import { useEffect } from "react";
import { reducedMotion } from "@/lib/motion";

export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    import("lenis").then(async ({ default: Lenis }) => {
      const { default: Snap } = await import("lenis/snap");
      if (disposed) return;

      const lenis = new Lenis({ duration: 0.75, anchors: true });
      const snap = new Snap(lenis, { type: "proximity", distanceThreshold: "20%" });
      const unsubs: (() => void)[] = [];

      // Chapters' own rail ticks (steps.tsx) already jump to the right scroll position within the pinned
      // section by their own formula; the stops share one grid cell, so Lenis's anchor handling would resolve
      // #build-1 etc. to the wrong offset. steps.tsx's own click handler (on the section) runs first in the
      // bubble phase; stop the event there, before it reaches Lenis's window-level anchor listener.
      const stopOwnAnchor = (e: MouseEvent) => {
        if ((e.target as Element | null)?.closest?.(".steps-i")) e.stopPropagation();
      };
      document.addEventListener("click", stopOwnAnchor);

      const topH = () => document.getElementById("top")?.getBoundingClientRect().height ?? 0;

      function points(): number[] {
        const th = topH();
        const pts: number[] = [];

        const exp = document.getElementById("exp");
        if (exp) {
          const expTop = exp.getBoundingClientRect().top + scrollY;
          const pin = exp.querySelector<HTMLElement>(".exp-pin");
          if (exp.classList.contains("gl-ready") && !exp.classList.contains("static") && pin) {
            const run = exp.offsetHeight - pin.offsetHeight;
            [0, 0.17, 0.44, 0.79].forEach((f) => pts.push(expTop - th + f * run));
          } else pts.push(expTop - th);
        }

        const who = document.getElementById("who");
        if (who) {
          const secTop = who.getBoundingClientRect().top + scrollY;
          if (who.classList.contains("pinned")) {
            const stops = who.querySelectorAll<HTMLElement>(".steps-stop");
            const pin = who.querySelector<HTMLElement>(".steps-pin");
            const n = stops.length;
            if (n && pin) {
              const run = who.offsetHeight - pin.offsetHeight;
              for (let i = 0; i < n; i++) pts.push(secTop - th + ((i + 0.5) / n) * run);
            }
          } else pts.push(secTop - th);
        }

        const map = document.getElementById("map");
        if (map) pts.push(map.getBoundingClientRect().top + scrollY - th);
        const contact = document.getElementById("contact");
        if (contact) pts.push(contact.getBoundingClientRect().top + scrollY - th);

        return pts;
      }

      function resnap() {
        unsubs.splice(0).forEach((u) => u());
        points().forEach((p) => unsubs.push(snap.add(p)));
      }

      resnap();
      window.addEventListener("resize", resnap);

      const exp = document.getElementById("exp");
      const who = document.getElementById("who");
      const mo = new MutationObserver(resnap);
      if (exp) mo.observe(exp, { attributes: true, attributeFilter: ["class"] });
      if (who) mo.observe(who, { attributes: true, attributeFilter: ["class"] });

      let raf = 0;
      function loop(time: number) {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      teardown = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resnap);
        document.removeEventListener("click", stopOwnAnchor);
        mo.disconnect();
        unsubs.forEach((u) => u());
        snap.destroy();
        lenis.destroy();
      };
      if (disposed) teardown();
    });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return null;
}
