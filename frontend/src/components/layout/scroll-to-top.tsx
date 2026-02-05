"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Multiple attempts to ensure scroll works
    // Immediate scroll
    window.scrollTo(0, 0);
    
    // After paint
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    
    // Fallback with slight delay for slow renders
    const timeout = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
