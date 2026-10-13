"use client";

// Reveal: port of KIT.reveal (drafted.html:669-683) — readable at rest,
// animates from a visible state once scrolled into view.
// PenBlocks: port of the sheet blocks' reveal (drafted.html:1880-1887) — each
// `.ln` gets its drafting delay (`--i`/`--d`) before the `.blk` is observed.

import { cloneElement, isValidElement, useCallback, useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { SPEED } from "@/lib/tempo";

function reduced(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface RevealProps {
  children: ReactElement<{ className?: string }>;
}

export function Reveal({ children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // a callback ref (not the ref object itself) passed into cloneElement, so the
  // merge happens on attach rather than reading `.current` during render.
  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) {
        el.classList.add("is-in");
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!isValidElement(children)) return children;
  const className = [children.props.className, "kit-reveal"].filter(Boolean).join(" ");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, react-hooks/refs -- merging a ref into an arbitrary child via cloneElement is the one legitimate case this rule can't distinguish from an unsafe render-time ref read
  return cloneElement(children, { ref: setRef, className } as any);
}

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
