"use client";

// Esc / "← Back to index" on a sheet page: D1 (plain routes, no SPA modal).
// router.back() when the visitor came here from a WorksIndex row (so the
// index's scroll position is restored natively); otherwise a plain push to
// /projects (a hard-loaded sheet URL has no index state to go back to).
// cameFromIndex is a module flag — it survives a client-side navigation
// (same JS module) but resets on a hard reload, which is exactly D1's
// "hard load Esc -> /projects" rule.
// See design/drafted/BUILD-PLAN.md §4.6 ("Inspect ..." row).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

let cameFromIndex = false;

/** Called by WorksIndex just before it navigates to a sheet. */
export function markCameFromIndex() {
  cameFromIndex = true;
}

export function SheetKeys({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    if (cameFromIndex) {
      document.getElementById(`t-${slug}`)?.focus({ preventScroll: true });
    }

    function back() {
      if (cameFromIndex) router.back();
      else router.push("/projects");
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        back();
      }
    }
    function onClick(e: MouseEvent) {
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest("[data-sheet-back]")) return;
      e.preventDefault();
      back();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [router, slug]);

  return null;
}
