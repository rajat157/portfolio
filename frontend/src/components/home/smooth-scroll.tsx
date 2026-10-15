"use client";

// Smooth scrolling and section paging on the home (Rajat, reviewing options a–c on 2026-10-15: c's "free inside a
// section, snap between them" is closest, but it overshot and came back, and a section must snap both ways; "maybe
// Lenis and virtual scroll").
// Lenis smooths the wheel and drives touch. Inside a section's own scroll (the hero's story, the chapters' stops, the
// brief and below) the page moves freely. A gesture that leaves a section is taken over before the page moves: it
// goes straight to the next section's first frame (the previous section's last, scrolling up), and the rest of that
// gesture (a trackpad's coasting, a touch's fling) is swallowed, so it can't run on past the next section. The next
// gesture moves on. Keyboard and scrollbar scroll as always, and so does the brief's text box. Off under reduced
// motion (lib/motion, which honours the site's Motion toggle).
import { useEffect } from "react";
import type Lenis from "lenis";
import { reducedMotion } from "@/lib/motion";

let lenisRef: Lenis | null = null;
let held = false;
// for whatever moves the page itself (the sheet map's dive): smooth scroll and paging stand still meanwhile
export function holdScroll(on: boolean) {
  held = on;
  if (on) lenisRef?.stop();
  else lenisRef?.start();
}

const out4 = (t: number) => 1 - (1 - t) ** 4;
// a section's own scroll, from its first frame to its last (a === b: a section of one frame)
type Seg = { a: number; b: number };

export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    let disposed = false;
    let teardown: (() => void) | undefined;

    (async () => {
      const { default: LenisClass } = await import("lenis");
      if (disposed) return;
      const topH = () => document.getElementById("top")?.getBoundingClientRect().height ?? 0;

      // measured each time: the stage, the chapters and the sheet map all change the page's length as they come up
      function segments(): Seg[] {
        const th = topH();
        const y = scrollY;
        const view = innerHeight - th;
        const max = document.documentElement.scrollHeight - innerHeight;
        const segs: Seg[] = [];
        const add = (id: string, pinSel?: string) => {
          const el = document.getElementById(id);
          if (!el) return;
          const a = el.getBoundingClientRect().top + y - th;
          const pin = pinSel ? el.querySelector<HTMLElement>(pinSel) : null;
          // a pinned section scrolls through its run; any other, through whatever it has beyond one window
          const run = pin && pin.offsetHeight < el.offsetHeight - 1 ? el.offsetHeight - pin.offsetHeight : Math.max(0, el.offsetHeight - view);
          segs.push({ a, b: id === "contact" ? max : a + run });
        };
        add("exp", ".exp-pin");
        add("who", ".steps-pin");
        add("map");
        add("contact");
        const clampY = (v: number) => Math.round(Math.min(Math.max(v, 0), max));
        return segs.map((s) => ({ a: clampY(s.a), b: clampY(s.b) }));
      }

      let paging = false; // a page turn is under way
      let pageT = 0;
      let gesture = 0; // input bursts: a new one after a pause in the wheel, or at each touch
      let lastInput = 0;
      let quiet = 0; // frames drawn since the last input
      let swallowed = -1; // the gesture that turned a page: the rest of it is spent
      const spend = (event: Event) => {
        if (event.cancelable) event.preventDefault();
        return false;
      };

      const lenis: Lenis = new LenisClass({
        lerp: 0.2,
        syncTouch: true,
        respectReducedMotion: false,
        prevent: (node) => node.nodeName === "TEXTAREA",
        virtualScroll: ({ deltaY, event }) => {
          const now = performance.now();
          const touch = event.type.startsWith("touch");
          if (touch && (event as TouchEvent).touches.length > 1) return false; // a pinch: the browser's zoom, uncancelled
          // a pause is 160ms and two frames without input: what a slow frame held up arrives at once, coalesced, after it
          if (touch ? event.type === "touchstart" : now - lastInput > 160 && quiet > 1) gesture++;
          lastInput = now;
          quiet = 0;
          if (held || paging || gesture === swallowed) return spend(event);
          // where this input would take the page (a touch's release: where its fling would coast to)
          const step = event.type === "touchend" ? Math.sign(deltaY) * Math.abs(lenis.velocity) ** 1.7 : deltaY;
          // zoom, a sideways move, a release with no fling and the brief's text box: theirs (Lenis lets the box scroll
          // itself: `prevent`)
          if (event.ctrlKey || !step || (event.target as Element).closest?.("textarea")) return true;
          const pos = lenis.targetScroll;
          const next = pos + step;
          const segs = segments();
          const inside = segs.find((s) => pos >= s.a - 2 && pos <= s.b + 2);
          if (inside && next >= inside.a - 2 && next <= inside.b + 2) return true; // within its own scroll
          // leaving it: straight to the next section's first frame (down) or the previous one's last (up)
          const target = step > 0 ? segs.find((s) => s.a > pos + 2)?.a : segs.findLast((s) => s.b < pos - 2)?.b;
          if (target === undefined) return true; // past the first or the last section: Lenis clamps
          paging = true;
          swallowed = gesture;
          const duration = Math.min(1.1, Math.max(0.6, 0.45 + (0.4 * Math.abs(target - lenis.animatedScroll)) / innerHeight));
          const done = () => {
            clearTimeout(pageT);
            paging = false;
          };
          lenis.scrollTo(target, { duration, easing: out4, lock: true, onComplete: done });
          pageT = window.setTimeout(done, duration * 1000 + 400); // in case the turn is cut short
          return spend(event);
        },
      });
      lenisRef = lenis;
      if (held) lenis.stop();

      let raf = 0;
      const loop = (time: number) => {
        quiet++;
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      teardown = () => {
        cancelAnimationFrame(raf);
        clearTimeout(pageT);
        lenis.destroy();
        if (lenisRef === lenis) lenisRef = null;
        held = false;
      };
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return null;
}
