"use client";

// The header's Motion toggle. CSS shows it only when the system asks for reduced motion (globals.css), so it is
// an opt-in for people whose OS turns animation off but who want the full site. The stage and the reveals read
// the setting once on mount, so a switch reloads the page.

import { useSyncExternalStore } from "react";
import { MOTION_KEY } from "@/lib/motion";

// set before paint by the boot script and only changed by a reload, so nothing to subscribe to
const noop = () => () => {};

export function MotionToggle() {
  const on = useSyncExternalStore(noop, () => document.documentElement.dataset.motion === "on", () => false);

  function toggle() {
    try {
      if (on) localStorage.removeItem(MOTION_KEY);
      else localStorage.setItem(MOTION_KEY, "on");
    } catch {
      // storage blocked: the choice lasts for this page only
    }
    if (on) delete document.documentElement.dataset.motion;
    else document.documentElement.dataset.motion = "on";
    location.reload();
  }

  return (
    <button id="motionBtn" className="toggle needs-js motion-toggle" type="button" aria-pressed={on} onClick={toggle}>
      <span className="snd-mark" aria-hidden="true" />
      <span className="snd-label">Motion</span>
    </button>
  );
}
