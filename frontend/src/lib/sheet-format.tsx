// Small formatting helpers shared between the (server) projects pages and
// the (client) WorksIndex/SheetFigure components. No "use client" here: a
// plain function export from a client module becomes a client reference and
// can't be called directly from server code (only rendered as a component),
// so these live in their own server-safe module instead of works-index.tsx.

import type { ReactNode } from "react";

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function stackCell(techs: string[]): ReactNode {
  const shown = techs.slice(0, 3);
  const extra = techs.length - shown.length;
  return (
    <>
      {shown.join(" · ")}
      {extra > 0 && (
        <span className="more">
          {" "}
          +{extra}
          <span className="sr-only"> more</span>
        </span>
      )}
    </>
  );
}
