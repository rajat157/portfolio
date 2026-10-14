import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sheet not found",
};

// The sheet language (BUILD-PLAN.md §5 P5 step 4, D27): no old 404 design left.
// Still returns HTTP 404 (Next renders this tree for not-found() with that status).
export default function NotFound() {
  return (
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
  );
}
