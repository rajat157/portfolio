"use client";

// PROTOTYPE for Rajat's review (proto/smooth-snap, not for merge as is): smooth scrolling and snapping on the home, in
// three ways to choose from with ?scroll= (default b):
//  a  stops:    smoothed wheel; every scroll moves one stop: each hero step, each chapter stop, the map, the brief.
//  b  sections: smoothed wheel, free inside the hero's story and the chapters; each section snaps into place as it
//               arrives (and its last frame, scrolling back up): the hero, Who I am, Where to next, the brief.
//  c  native:   the browser's own scrolling, with b's section snap.
// The snap follows the gesture: a deliberate scroll moves on to the next stop in its direction (or, flung, to the
// stop nearest where it was headed); a nudge settles back. Only wheel, trackpad and touch gestures snap: keyboard,
// scrollbar and in-page links scroll as they always do (Lenis's own anchor handling stays off: it ignores a prevented
// click, so it would take over the sheet map's links), and so does the rest of the page below the brief.
// Off under reduced motion (lib/motion, which honours the site's Motion toggle).
import { useEffect } from "react";
import type Lenis from "lenis";
import { reducedMotion } from "@/lib/motion";

let lenisRef: Lenis | null = null;
let held = false;
// for whatever moves the page itself (the sheet map's dive): the smooth scroll and the snap stand still meanwhile
export function holdScroll(on: boolean) {
  held = on;
  if (on) lenisRef?.stop();
  else lenisRef?.start();
}

const out4 = (t: number) => 1 - (1 - t) ** 4;
// settled points of the hero's story (stage.tsx: step 1 animates 0.04–0.26, step 2 0.30–0.46, step 3 0.62–0.88)
const HERO_STEPS = [0, 0.28, 0.45, 0.92];

type Mode = "a" | "b" | "c";

export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    const q = new URLSearchParams(location.search).get("scroll");
    const mode: Mode = q === "a" || q === "c" ? q : "b";
    let disposed = false;
    let teardown: (() => void) | undefined;

    (async () => {
      const lenis = mode === "c" ? null : new (await import("lenis")).default({ lerp: 0.16, respectReducedMotion: false });
      if (disposed) return lenis?.destroy();
      lenisRef = lenis;
      held = false;
      const topH = () => document.getElementById("top")?.getBoundingClientRect().height ?? 0;
      // where the page is headed: Lenis's own target, or (native) where the wheel's deltas so far will take it, since
      // the browser is still animating them when the gesture ends
      let gestureDelta = 0;
      const where = () => (lenis ? lenis.targetScroll : Math.min(Math.max(scrollY, 0), document.documentElement.scrollHeight - innerHeight));

      // where the page may come to rest, and the stretches it scrolls through freely
      function plan() {
        const th = topH();
        const y = scrollY;
        const vh = innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        const stops: number[] = [];
        const free: [number, number][] = [];
        const top = (el: HTMLElement) => el.getBoundingClientRect().top + y - th;
        // a section taller than the window scrolls freely inside (stacked chapters, the plain map on a phone)
        const tall = (el: HTMLElement) => {
          const t = top(el);
          stops.push(t);
          if (el.offsetHeight > vh - th + 2) free.push([t, t + el.offsetHeight - (vh - th)]);
        };

        const exp = document.getElementById("exp");
        const expPin = exp?.querySelector<HTMLElement>(".exp-pin");
        if (exp && expPin && exp.classList.contains("gl-ready")) {
          const t = top(exp);
          const run = exp.offsetHeight - expPin.offsetHeight;
          if (mode === "a") HERO_STEPS.forEach((f) => stops.push(t + f * run));
          else {
            stops.push(t, t + run);
            free.push([t, t + run]);
          }
        } else if (exp) tall(exp);

        const who = document.getElementById("who");
        const whoPin = who?.querySelector<HTMLElement>(".steps-pin");
        if (who && whoPin && who.classList.contains("pinned")) {
          const t = top(who);
          const run = who.offsetHeight - whoPin.offsetHeight;
          const n = who.querySelectorAll(".steps-stop").length || 1;
          if (mode === "a") for (let i = 0; i < n; i++) stops.push(t + (i ? ((i + 0.5) / n) * run : 0));
          else {
            stops.push(t, t + run);
            free.push([t, t + run]);
          }
        } else if (who) tall(who);

        const map = document.getElementById("map");
        if (map) tall(map);
        const contact = document.getElementById("contact");
        if (contact) {
          const k = Math.min(top(contact), max);
          stops.push(k);
          free.push([k, Infinity]);
        }
        return { stops: stops.map((p) => Math.round(Math.min(Math.max(p, 0), max))), free };
      }

      // a deliberate scroll moves on to the stop nearest where it was going, in its direction; a nudge settles back
      function settle(from: number, to: number) {
        if (held) return;
        const { stops, free } = plan();
        if (!stops.length || free.some(([a, b]) => to > a + 2 && to < b - 2)) return;
        const nearest = (list: number[]) => list.reduce<number | null>((best, p) => (best === null || Math.abs(p - to) < Math.abs(best - to) ? p : best), null);
        const d = to - from;
        const target = Math.abs(d) < 0.06 * innerHeight ? nearest(stops) : (nearest(stops.filter((p) => (p - from) * Math.sign(d) > 1)) ?? nearest(stops));
        if (target === null || Math.abs(target - to) < 2) return;
        if (lenis) lenis.scrollTo(target, { lerp: 0, duration: Math.min(1, Math.max(0.45, 0.35 + (0.35 * Math.abs(target - scrollY)) / innerHeight)), easing: out4 });
        else scrollTo({ top: target, behavior: "smooth" });
      }

      // wheel and trackpad: the gesture ends when its events stop (a trackpad's inertia included)
      let gestureFrom: number | null = null;
      let wheelT = 0;
      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || held) return;
        if (gestureFrom === null) {
          gestureFrom = where();
          gestureDelta = 0;
        }
        gestureDelta += e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
        clearTimeout(wheelT);
        wheelT = window.setTimeout(() => {
          const from = gestureFrom ?? where();
          gestureFrom = null;
          const max = document.documentElement.scrollHeight - innerHeight;
          settle(from, lenis ? where() : Math.min(Math.max(from + gestureDelta, 0), max));
        }, 120);
      };
      // touch: the page coasts natively after the finger lifts; the gesture ends when it comes to rest
      let touchFrom: number | null = null;
      let touching = false;
      let restT = 0;
      const onTouchStart = () => {
        touching = true;
        touchFrom ??= scrollY;
        clearTimeout(restT);
      };
      const onTouchEnd = () => {
        touching = false;
        onScroll();
      };
      const onScroll = () => {
        if (touching || touchFrom === null) return;
        clearTimeout(restT);
        restT = window.setTimeout(() => {
          const from = touchFrom ?? scrollY;
          touchFrom = null;
          settle(from, scrollY);
        }, 140);
      };
      addEventListener("wheel", onWheel, { passive: true, capture: true }); // before Lenis moves its target
      addEventListener("touchstart", onTouchStart, { passive: true });
      addEventListener("touchend", onTouchEnd, { passive: true });
      addEventListener("touchcancel", onTouchEnd, { passive: true });
      addEventListener("scroll", onScroll, { passive: true });

      let raf = 0;
      if (lenis) {
        const loop = (time: number) => {
          lenis.raf(time);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
      teardown = () => {
        cancelAnimationFrame(raf);
        clearTimeout(wheelT);
        clearTimeout(restT);
        removeEventListener("wheel", onWheel, { capture: true });
        removeEventListener("touchstart", onTouchStart);
        removeEventListener("touchend", onTouchEnd);
        removeEventListener("touchcancel", onTouchEnd);
        removeEventListener("scroll", onScroll);
        lenis?.destroy();
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
