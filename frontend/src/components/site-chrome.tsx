"use client";

// Port of the home prototype's header (design/drafted/home-prototype.html:613-627)
// and drafted.html's footer (:566-576, minus the email — D28).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ConstructionToggle } from "@/components/construction";
import { SoundToggle } from "@/components/sound-toggle";
import { MotionToggle } from "@/components/motion-toggle";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();

  // --top-h is the header's real height (it wraps to two rows on phones): sticky bars and the reading progress
  // sit just under it on every page, not only where the home stage measures it
  useEffect(() => {
    const top = document.getElementById("top");
    if (!top) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--top-h", Math.round(top.getBoundingClientRect().height) + "px"));
    ro.observe(top);
    return () => ro.disconnect();
  }, []);

  return (
    <header className="top" id="top">
      <div className="container top-in">
        <Link className="mark" href="/">
          <b>Rajat</b>
        </Link>
        <nav className="nav" aria-label="Site">
          {NAV.map((item) => {
            const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className="nav-a"
                href={item.href}
                aria-current={current ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="tools">
          <MotionToggle />
          <SoundToggle />
          <ConstructionToggle />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="container foot-in">
        <span className="lab">Elsewhere</span>
        <a href="https://github.com/rajat157" target="_blank" rel="noopener noreferrer">
          GitHub<span aria-hidden="true">&nbsp;↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href="https://www.linkedin.com/in/rajat-kumar-r" target="_blank" rel="noopener noreferrer">
          LinkedIn<span aria-hidden="true">&nbsp;↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <span className="lab place">Bangalore, India</span>
      </div>
    </footer>
  );
}
