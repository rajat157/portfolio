import type { Metadata } from "next";
import { Instrument_Sans, Martian_Mono, Caveat, Doto } from "next/font/google";
import Link from "next/link";
import "./(site)/globals.css";
import { Header, Footer } from "@/components/site-chrome";

// Root-level not-found (BUILD-PLAN.md §5 P5 step 4, D27): `/does-not-exist` and
// any other unmatched path falls through both route groups' layouts to here,
// since neither (site) nor (payload) owns the whole URL space. Duplicates just
// enough of (site)/layout.tsx's shell (fonts, globals.css, chrome) to stay in
// the sheet language instead of Next's default 404.
const sans = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans", display: "swap" });
const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-hand", display: "swap" });
const count = Doto({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-count", display: "swap" });

export const metadata: Metadata = {
  title: "Sheet not found",
};

export default function RootNotFound() {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${hand.variable} ${count.variable}`}>
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
