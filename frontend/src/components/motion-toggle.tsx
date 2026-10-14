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
    if (on) delete document.documentElement.dataset.motion;
    else document.documentElement.dataset.motion = "on";
    try {
      if (on) localStorage.removeItem(MOTION_KEY);
      else localStorage.setItem(MOTION_KEY, "on");
    } catch {
      // storage blocked: a reload would forget the choice, so keep this page (CSS motion follows at once;
      // the stage, which reads the setting on mount, stays as it is)
      return;
    }
    location.reload();
  }

  return (
    <button id="motionBtn" className="toggle needs-js motion-toggle" type="button" aria-pressed={on} onClick={toggle}>
      {/* its square glides when it is on */}
      <svg className="tg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 17h18" strokeDasharray="2 2.5" />
        <path d="M3 12h6M3 8h4" />
        <rect className="sq" x="12" y="7.5" width="6" height="6" fill="currentColor" stroke="none" />
      </svg>
      <span className="tg-label">Motion</span>
      <span className="tip" aria-hidden="true">
        {on ? "Motion on" : "Motion off"}
      </span>
    </button>
  );
}
