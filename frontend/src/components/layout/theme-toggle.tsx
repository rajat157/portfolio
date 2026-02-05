"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = async () => {
    const isDark = theme === "dark";
    const newTheme = isDark ? "light" : "dark";
    
    // Check if View Transitions API is supported
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme);
      return;
    }

    // Get the click position (center of button)
    const button = buttonRef.current;
    if (!button) {
      setTheme(newTheme);
      return;
    }

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate the radius needed to cover the entire screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Clip paths for animation (centered on toggle button)
    const clipStart = `circle(0px at ${x}px ${y}px)`;
    const clipEnd = `circle(${endRadius}px at ${x}px ${y}px)`;

    // Start the view transition
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    // Wait for transition to be ready, then animate
    await transition.ready;

    if (isDark) {
      // Dark to Light: expand light (new) FROM the toggle button
      await document.documentElement.animate(
        { clipPath: [clipStart, clipEnd] },
        {
          duration: 500,
          easing: "ease-out",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        }
      ).finished;
    } else {
      // Light to Dark: shrink light (old) TOWARDS the toggle button
      await document.documentElement.animate(
        { clipPath: [clipEnd, clipStart] },
        {
          duration: 500,
          easing: "ease-out",
          fill: "forwards",
          pseudoElement: "::view-transition-old(root)",
        }
      ).finished;
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
