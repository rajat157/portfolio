// The home stage's SSR / no-JS / LCP mark (D21, BUILD-PLAN.md §0 item 2).
// The outline is generated once by scripts/font-metrics.py into
// src/lib/name-outline.ts, so the letterforms are identical in every engine
// with no font-load race — stage.tsx rasterises the same path (Path2D) for
// the shard texture, instead of canvas fillText.
import { NAME_CAP, NAME_DOT, NAME_GAP, NAME_PATH, NAME_RUN, NAME_VIEW_H, NAME_VIEW_W } from "@/lib/name-outline";

// --ink / --orange (globals.css tokens), hardcoded: a data: URI SVG is its
// own document and cannot read the page's CSS custom properties. The site
// is light-only (D-summary #1), so these never need to vary.
const INK = "#0D0F12";
const ORANGE = "#FF4D12";

export function NameMark() {
  const dotX = NAME_RUN + NAME_GAP;
  const dotY = NAME_CAP - NAME_DOT;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${NAME_VIEW_W} ${NAME_VIEW_H}"><path d="${NAME_PATH}" fill="${INK}"/><rect x="${dotX}" y="${dotY}" width="${NAME_DOT}" height="${NAME_DOT}" fill="${ORANGE}"/></svg>`;
  // An <img> (not a bare inline <svg>) so it registers as a normal image for
  // the Largest Contentful Paint heuristic -- a hand-drawn <svg><path> alone
  // is not an LCP-eligible content type, but an <img> is. The data: URI
  // keeps it inline (no network request) and server-rendered. Sized by
  // globals.css' `.fallback-name img` rule.
  // base64 (not percent-encoding): the output alphabet is plain
  // alphanumerics, "+", "/" and "=" only, so nothing in it can be mistaken
  // for markup by any HTML-serialization step between here and the browser.
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  // eslint-disable-next-line @next/next/no-img-element -- next/image's loader/optimizer does not apply to an inline data: URI
  return <img aria-hidden="true" alt="" src={`data:image/svg+xml;base64,${base64}`} />;
}
