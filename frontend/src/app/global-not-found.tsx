import type { Metadata } from "next";
import Link from "next/link";
import "./(site)/globals.css";
import { Header, Footer } from "@/components/site-chrome";
import { fontVariables } from "@/lib/fonts";

// Global not-found (BUILD-PLAN.md §5 P5 step 4, D27; experimental.globalNotFound in next.config):
// `/does-not-exist` and any other unmatched path lands here, since neither route group, (site) nor (payload), owns
// the whole URL space. It is a whole document with no layout around it: as a root not-found.tsx it was wrapped in
// Next's default root layout, so the page had two <html> and two <body>. Duplicates just enough of
// (site)/layout.tsx's shell (fonts, globals.css, chrome) to stay in the sheet language.

export const metadata: Metadata = {
  title: "Sheet not found",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">
          <div className="sheet">
            <div className="sheet-grid">
              <div className="sh-head">
                <p className="lab">404 · Not on this sheet</p>
                <h1 className="sheet-title">Sheet not found</h1>
                <p className="sheet-one">
                  This sheet isn&apos;t in the set. It may have moved, or the link is off by a digit.
                </p>
                <p className="sheet-one">
                  <Link href="/#map">Back to the site map</Link>
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
