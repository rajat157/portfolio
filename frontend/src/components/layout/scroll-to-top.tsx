"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLenis } from "lenis/react";

export function ScrollToTop() {
  const pathname = usePathname();
  const lenis = useLenis();

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // Scroll to top on every pathname change
  useEffect(() => {
    // Use Lenis's scrollTo if available, otherwise fall back to native
    if (lenis) {
      // immediate: true skips the smooth animation for instant scroll
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return null;
}
