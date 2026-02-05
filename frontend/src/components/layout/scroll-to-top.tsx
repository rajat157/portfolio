"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top after Next.js navigation completes
    // Small delay ensures this runs after Next.js's own scroll handling
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 0);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
