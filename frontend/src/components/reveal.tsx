"use client";

// PenBlocks: port of the sheet blocks' reveal (drafted.html:1880-1887) — each
// `.ln` gets its drafting delay (`--i`/`--d`) before the `.blk` is observed.

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { SPEED } from "@/lib/tempo";
import { reducedMotion as reduced } from "@/lib/motion";

interface PenBlocksProps {
  children: ReactNode;
  className?: string;
}

export function PenBlocks({ children, className }: PenBlocksProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lines = el.querySelectorAll<HTMLElement>(".ln");
    if (reduced()) {
      el.classList.add("is-in");
      return;
    }
    el.classList.add("pre");
    lines.forEach((ln, k) => {
      ln.style.setProperty("--i", String(k));
      ln.style.setProperty("--d", `${Math.round(ln.getBoundingClientRect().width / SPEED)}ms`);
    });
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={["blk", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
