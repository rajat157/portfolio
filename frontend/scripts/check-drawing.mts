/**
 * Asserts the invariants src/lib/drawing.ts relies on: parseDrawing()'s
 * rejection rules, describe() matching the prototype's .dia-text strings
 * exactly, and drawLayout()'s geometry (drafted.html:775-1123, :1492-1729;
 * design/drafted/BUILD-PLAN.md §3.1/§3.2; the geometry rules port
 * design/drafted/verify.mjs:207-219). Plain node:assert, no test framework.
 *
 *   node_modules\.bin\tsx.cmd scripts/check-drawing.mts
 *
 * Exits non-zero (and throws, with a stack trace pointing at the failing
 * assertion) the moment any invariant breaks.
 */
import assert from "node:assert/strict";
import { parseDrawing, describe, drawLayout, textWidth, type Drawing, type Mark } from "../src/lib/drawing";

let n = 0;
function ok(cond: boolean, msg: string): void {
  assert.ok(cond, msg);
  n++;
}

/* ------------------------------------------------- the 4 live drawings -- */
/* Verbatim from BUILD-PLAN.md §3.1 (itself verbatim from drafted.html:775-1123). */

const DRAWINGS: Record<string, { raw: unknown; name: string; diaText: string }> = {
  "b2b-wholesale-platform": {
    name: "Offpriced",
    diaText:
      "Architecture of Offpriced: The public, Signed-in buyers, The team working those deals and Whoever edits the site to One application; One application to One database (one codebase, one database).",
    raw: {
      nodes: {
        public: "The public",
        buyers: "Signed-in buyers",
        staff: "The team working those deals",
        editors: "Whoever edits the site",
        app: "One application",
        db: "One database",
      },
      edges: [
        ["public", "app"],
        ["buyers", "app"],
        ["staff", "app"],
        ["editors", "app"],
        ["app", "db", "one codebase, one database"],
      ],
      lay: { dir: "TB", layers: [["public", "buyers", "staff", "editors"], ["app"], ["db"]], span: ["app", "db"] },
      notes: [
        [["public", "buyers", "staff", "editors"], "four audiences, one application"],
        [["public"], "The Floor: lots from 57 factories, trade only"],
        [["app"], "Payload CMS embedded: one deployment, one login"],
      ],
    },
  },
  "staffing-operations-platform": {
    name: "Staffing operations platform",
    diaText:
      "Architecture of Staffing operations platform: Admin, Client, Worker, Partner and Onboarding to Shared core; Shared core to Database — row-level security.",
    raw: {
      nodes: {
        admin: "Admin",
        client: "Client",
        worker: "Worker",
        partner: "Partner",
        onboarding: "Onboarding",
        core: "Shared core",
        db: "Database — row-level security",
      },
      edges: [
        ["admin", "core"],
        ["client", "core"],
        ["worker", "core"],
        ["partner", "core"],
        ["onboarding", "core"],
        ["core", "db"],
      ],
      lay: {
        dir: "LR",
        layers: [["admin", "client", "worker", "partner", "onboarding"], ["core"], ["db"]],
        span: ["core", "db"],
        walls: "db",
      },
      notes: [
        [["all"], "927 automated tests run against all of it"],
        [["admin", "client", "worker", "partner", "onboarding"], "five portals, one login"],
        [["db"], "row-level security checks every read and write"],
      ],
    },
  },
  "esports-talent-portfolio": {
    name: "lucif3r",
    diaText:
      "Architecture of lucif3r: Control Room (Payload CMS) to PostgreSQL (stores content); Control Room (Payload CMS) to Live pages (publish); PostgreSQL to Live pages (serves).",
    raw: {
      nodes: { cms: "Control Room (Payload CMS)", db: "PostgreSQL", live: "Live pages" },
      edges: [
        ["cms", "db", "stores content"],
        ["cms", "live", "publish"],
        ["db", "live", "serves"],
      ],
      lay: { dir: "TB", layers: [["cms"], ["db"], ["live"]], side: [["cms", "live"]], shift: 0.4 },
      notes: [
        [["cms"], "live preview, draft/publish, editable brand colours"],
        [["live"], "measured in qualified enquiries, not pageviews"],
      ],
    },
  },
  "tredye-trading-platform": {
    name: "Tredye",
    diaText:
      "Architecture of Tredye: Kite Connect to Data ingestion (WebSocket); Data ingestion to Candle builder (Kafka · ticks); Candle builder to RSI calculator (Kafka · candles); Candle builder to MACD calculator (Kafka · candles); RSI calculator to Divergence detector (Kafka · RSI); MACD calculator to MACD strategy detector (Kafka · MACD); Divergence detector and MACD strategy detector to API gateway (Kafka · alerts and setups); API gateway to Next.js dashboard (WebSocket).",
    raw: {
      nodes: {
        kite: "Kite Connect",
        ingestion: "Data ingestion",
        candles: "Candle builder",
        rsi: "RSI calculator",
        divergence: "Divergence detector",
        macd: "MACD calculator",
        macdstrategy: "MACD strategy detector",
        gateway: "API gateway",
        dashboard: "Next.js dashboard",
      },
      edges: [
        ["kite", "ingestion", "WebSocket"],
        ["ingestion", "candles", "Kafka · ticks"],
        ["candles", "rsi", "Kafka · candles"],
        ["candles", "macd", "Kafka · candles"],
        ["rsi", "divergence", "Kafka · RSI"],
        ["macd", "macdstrategy", "Kafka · MACD"],
        ["divergence", "gateway", "Kafka · alerts and setups"],
        ["macdstrategy", "gateway", "Kafka · alerts and setups"],
        ["gateway", "dashboard", "WebSocket"],
      ],
      lay: {
        dir: "TB",
        layers: [["kite"], ["ingestion"], ["candles"], ["rsi", "macd"], ["divergence", "macdstrategy"], ["gateway"], ["dashboard"]],
      },
      notes: [
        [["rsi", "divergence"], "~800 live RSI streams: ~200 NSE stocks × 4 timeframes"],
        [["candles"], "candles aligned to the 9:15 IST open"],
        [["gateway"], "live board pushed from Redis every 2 s"],
        [["all"], "Kafka 4.1 in KRaft mode, no ZooKeeper to operate"],
      ],
    },
  },
};

const parsed: Record<string, Drawing> = {};
for (const [slug, { raw }] of Object.entries(DRAWINGS)) {
  const d = parseDrawing(raw);
  ok(d !== null, `${slug}: parses`);
  parsed[slug] = d!;
}

/* ------------------------------------------------------- describe() -- */

for (const [slug, { name, diaText }] of Object.entries(DRAWINGS)) {
  ok(describe(parsed[slug], name) === diaText, `${slug}: describe() matches the prototype's .dia-text exactly`);
}

/* --------------------------------------------------- invalid shapes -- */

const invalid: [string, unknown][] = [
  ["null", null],
  ["a string", "not a drawing"],
  ["nodes missing", { edges: [], lay: { dir: "TB", layers: [] } }],
  ["an empty node label", { nodes: { a: "" }, edges: [], lay: { dir: "TB", layers: [["a"]] } }],
  [
    "an edge referencing an unknown node",
    { nodes: { a: "A" }, edges: [["a", "b"]], lay: { dir: "TB", layers: [["a"]] } },
  ],
  ["an invalid dir", { nodes: { a: "A" }, edges: [], lay: { dir: "DIAGONAL", layers: [["a"]] } }],
  ["a node missing from layers", { nodes: { a: "A", b: "B" }, edges: [], lay: { dir: "TB", layers: [["a"]] } }],
  [
    "a node listed twice in layers",
    { nodes: { a: "A" }, edges: [], lay: { dir: "TB", layers: [["a"], ["a"]] } },
  ],
  [
    "shift out of [0,1]",
    { nodes: { a: "A" }, edges: [], lay: { dir: "TB", layers: [["a"]], shift: 1.5 } },
  ],
  [
    "a note referencing an unknown node",
    { nodes: { a: "A" }, edges: [], lay: { dir: "TB", layers: [["a"]] }, notes: [[["b"], "x"]] },
  ],
  [
    "a walls id that is not a node",
    { nodes: { a: "A" }, edges: [], lay: { dir: "TB", layers: [["a"]], walls: "nope" } },
  ],
];
for (const [label, shape] of invalid) {
  ok(parseDrawing(shape) === null, `rejects: ${label}`);
}

/* ---------------------------------------------------- layout geometry -- */

const PANEL = { fs: 13, efs: 10, nfs: 10, H: 460, notes: false };
function sheetOpts(W: number) {
  const small = W < 720;
  return { fs: small ? 13 : 15, efs: small ? 10 : 11, nfs: small ? 10 : 11, H: small ? 470 : 540, notes: true };
}

function boxBBox(d: string): { x0: number; y0: number; x1: number; y1: number } {
  const m = /^M([\d.-]+) ([\d.-]+)H([\d.-]+)V([\d.-]+)H/.exec(d);
  if (!m) throw new Error("not a box path: " + d);
  return { x0: +m[1] - 0.5, y0: +m[2] - 0.5, x1: +m[3] + 0.5, y1: +m[4] + 0.5 };
}

function lastPoint(d: string): [number, number] {
  const pts = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)];
  const last = pts[pts.length - 1];
  return [+last[1], +last[2]];
}

function textBounds(m: Mark & { kind: "text" }): [number, number] {
  const width = Math.max(...m.lines.map((l) => textWidth(l, m.font, m.fontSize)));
  const left = m.anchor === "start" ? m.x : m.anchor === "middle" ? m.x - width / 2 : m.x - width;
  return [left, left + width];
}

for (const [slug, d] of Object.entries(parsed)) {
  // flatten() mirrors Lo.all's build order in drawing.ts (every layer row, in id order) —
  // the same order drawLayout() pushes its d-box and d-edge marks in.
  const flatNodes = d.lay.layers.flat();

  for (const W of [358, 524, 848, 1232]) {
    for (const opts of [{ ...PANEL, W }, { ...sheetOpts(W), W }]) {
      const { W: outW, marks, end } = drawLayout(d, opts);

      ok(end === Math.max(...marks.map((m) => m.at + m.dur)), `${slug}@${W}: end equals max(at+dur) over all marks`);

      const boxMarks = marks.filter((m): m is Mark & { kind: "path" } => m.kind === "path" && m.cls === "d-box");
      ok(boxMarks.length === flatNodes.length, `${slug}@${W}: one d-box per node`);
      const boxes = boxMarks.map((m) => boxBBox(m.d));
      const byNode = new Map(flatNodes.map((id, i) => [id, boxes[i]]));

      let overlap = 0;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1) overlap++;
        }
      }
      ok(overlap === 0, `${slug}@${W} ${opts.notes ? "sheet" : "panel"}: no overlapping boxes`);

      const textMarks = marks.filter((m): m is Mark & { kind: "text" } => m.kind === "text");
      const oob = textMarks.filter((m) => {
        const [left, right] = textBounds(m);
        return left < -0.5 || right > outW + 0.5;
      });
      ok(oob.length === 0, `${slug}@${W} ${opts.notes ? "sheet" : "panel"}: every text inside [0, W]`);

      const edgeMarks = marks.filter((m): m is Mark & { kind: "path" } => m.kind === "path" && m.cls === "d-edge");
      ok(edgeMarks.length === d.edges.length, `${slug}@${W}: one d-edge per edge`);
      let misses = 0;
      edgeMarks.forEach((m, k) => {
        const target = byNode.get(d.edges[k][1])!;
        const [x, y] = lastPoint(m.d);
        const onVertical = (Math.abs(x - target.x0) <= 1 || Math.abs(x - target.x1) <= 1) && y >= target.y0 - 1 && y <= target.y1 + 1;
        const onHorizontal = (Math.abs(y - target.y0) <= 1 || Math.abs(y - target.y1) <= 1) && x >= target.x0 - 1 && x <= target.x1 + 1;
        if (!onVertical && !onHorizontal) misses++;
      });
      ok(misses === 0, `${slug}@${W} ${opts.notes ? "sheet" : "panel"}: every edge ends on its target's border`);
    }
  }
}

console.log(`check-drawing: all ${n} assertions passed`);
