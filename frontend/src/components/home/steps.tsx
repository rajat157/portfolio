"use client";

// A home section told in stops ("Who I am" in who.tsx, "What's slowing you down?" in pick.tsx). The server renders
// an index of #anchor links (.steps-i) over stacked stops (.steps-stop), which is the whole section with no JS or
// under reduced motion. With motion on and a tall enough window, the section pins (CSS: .steps.pinned) and scrolling
// steps through its stops one at a time; the index follows, a click on it jumps there, and numbers in a stop
// ([data-count]) count up as it opens. A brief button ([data-need]) ticks that need in the contact brief.

import { useEffect } from "react";
import { reducedMotion } from "@/lib/motion";
import { tick } from "@/lib/sound";

// every number in an element's text counts up from 0 ("10+", "24–48"), over the stop's draw-in
function countUp(el: HTMLElement) {
  const final = (el.dataset.count ||= el.textContent ?? "");
  const t0 = performance.now();
  const frame = (now: number) => {
    const u = Math.min(1, (now - t0) / 900);
    const e = 1 - (1 - u) ** 3;
    el.textContent = final.replace(/\d+/g, (m) => String(Math.round(Number(m) * e)));
    if (u < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function Steps({ id }: { id: string }) {
  useEffect(() => {
    const sec = document.getElementById(id);
    const pin = sec?.querySelector<HTMLElement>(".steps-pin");
    if (!sec || !pin) return;
    const chips = Array.from(sec.querySelectorAll<HTMLAnchorElement>(".steps-i"));
    const stops = Array.from(sec.querySelectorAll<HTMLElement>(".steps-stop"));
    const no = sec.querySelector<HTMLElement>(".steps-no");
    const n = stops.length;
    let cur = -1;
    let pinned = false;
    let raf = 0;

    const topH = () => document.getElementById("top")?.getBoundingClientRect().height ?? 0;
    const run = () => sec.offsetHeight - pin.offsetHeight;

    function set(i: number) {
      if (i === cur) return;
      const first = cur === -1;
      cur = i;
      stops.forEach((s, k) => {
        s.toggleAttribute("data-on", k === i);
        s.inert = k !== i;
      });
      chips.forEach((c, k) => (k === i ? c.setAttribute("aria-current", "step") : c.removeAttribute("aria-current")));
      if (no) no.textContent = String(i + 1).padStart(2, "0");
      stops[i].querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
      if (!first) tick();
    }

    // each stop owns an equal slice of the section's run, so a steady scroll gives each the same dwell
    function update() {
      raf = 0;
      if (!pinned) return;
      const r = run();
      const p = r > 0 ? (topH() - sec!.getBoundingClientRect().top) / r : 0;
      set(Math.min(n - 1, Math.max(0, Math.floor(p * n))));
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    function jump(i: number) {
      const top = sec!.getBoundingClientRect().top + scrollY - topH() + ((i + 0.5) / n) * run();
      scrollTo({ top, behavior: "auto" });
      set(i);
      stops[i].querySelector<HTMLElement>("[tabindex='-1']")?.focus({ preventScroll: true });
    }

    function mode() {
      const want = !reducedMotion() && innerHeight >= 560;
      if (want === pinned) return;
      pinned = want;
      sec!.classList.toggle("pinned", want);
      cur = -1;
      if (want) update();
      else {
        stops.forEach((s) => {
          s.removeAttribute("data-on");
          s.inert = false;
        });
        chips.forEach((c) => c.removeAttribute("aria-current"));
      }
    }

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      // a real click on the brief's radio, so the form's own handlers see it; the link then goes on to #contact
      const cta = t.closest<HTMLElement>("[data-need]");
      if (cta) {
        const radio = Array.from(document.querySelectorAll<HTMLInputElement>('#cform input[name="subject"]')).find((r) => r.value === cta.dataset.need);
        if (radio && !radio.checked) radio.click();
        return;
      }
      const chip = t.closest<HTMLAnchorElement>(".steps-i");
      if (chip && pinned) {
        e.preventDefault();
        jump(chips.indexOf(chip));
      }
    };
    const onResize = () => {
      mode();
      onScroll();
    };

    mode();
    sec.addEventListener("click", onClick);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      sec.removeEventListener("click", onClick);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
    };
  }, [id]);

  return null;
}
