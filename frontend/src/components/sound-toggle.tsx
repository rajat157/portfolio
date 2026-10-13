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
      <span className="snd-mark" aria-hidden="true" />
      <span className="snd-label">Sound</span>
    </button>
  );
}
