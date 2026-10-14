"use client";

// Opt-in UI sound toggle (D24), in the header tools alongside
// ConstructionToggle. Also wires the prototype's hover ticks for `.node`
// (home site-map) and `.nav-a` (home-prototype.html:1370), delegated from
// `document` since those elements come and go with client navigation.

import { useEffect, useState } from "react";
import { setSoundOn, tick } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let last: Element | null = null;
    function onOver(e: PointerEvent) {
      const el = (e.target as Element)?.closest?.(".node, .nav-a") ?? null;
      if (el && el !== last) tick();
      last = el;
    }
    document.addEventListener("pointerover", onOver);
    return () => document.removeEventListener("pointerover", onOver);
  }, []);

  return (
    <button
      id="soundBtn"
      className="toggle needs-js"
      type="button"
      aria-pressed={on}
      onClick={() => setOn(setSoundOn(!on))}
    >
      {/* its waves draw on when it is on */}
      <svg className="tg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" />
        <path className="w" pathLength={1} d="M15 9.5a3.5 3.5 0 0 1 0 5" />
        <path className="w w2" pathLength={1} d="M17.5 7a7 7 0 0 1 0 10" />
      </svg>
      <span className="tg-label">Sound</span>
      <span className="tip" aria-hidden="true">
        {on ? "Sound on" : "Sound off"}
      </span>
    </button>
  );
}
