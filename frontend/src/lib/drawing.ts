/**
 * Architecture drawing engine. A pure (no DOM), line-by-line port of
 * drafted.html's layout()/route()/edgeLabels()/wallsD()/describe()/
 * drawDiagram() (:1492-1729) into a deterministic layout that returns mark
 * objects instead of building SVG DOM, so it renders identically on the
 * server. See design/drafted/BUILD-PLAN.md §3.1/§3.2.
 */
import {
  LABEL_ADVANCES,
  LABEL_CENTRAL,
  MONO_ADVANCE,
  MONO_CENTRAL,
} from "./font-metrics";
import { GRID, SPEED, T, q } from "./tempo";

const R = Math.round;
function P5(v: number): number {
  return Math.round(v) + 0.5;
}

/* ------------------------------------------------------------------ types */

export type Edge = [from: string, to: string, label?: string];

export type Drawing = {
  nodes: Record<string, string>;
  edges: Edge[];
  lay: {
    dir: "TB" | "LR";
    layers: string[][];
    span?: string[];
    walls?: string;
    side?: [string, string][];
    shift?: number;
  };
  notes?: [ids: string[], text: string][];
};

export type Layer = "cons" | "ink";
export type Anim = "pen" | "ink" | "set" | null;

export interface PathMark {
  kind: "path";
  cls: string;
  d: string;
  layer: Layer;
  anim: Anim;
  at: number;
  dur: number;
}

export interface RectMark {
  kind: "rect";
  cls: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: Layer;
  anim: Anim;
  at: number;
  dur: number;
}

export interface TextMark {
  kind: "text";
  cls: string;
  font: "label" | "mono";
  fontSize: number;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  lines: string[];
  lineHeight: number;
  layer: Layer;
  anim: Anim;
  at: number;
  dur: number;
}

export type Mark = PathMark | RectMark | TextMark;

export type DrawOptions = {
  W: number;
  H: number;
  fs: number;
  efs: number;
  nfs: number;
  notes: boolean;
};

/* ------------------------------------------------------------- parsing -- */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v !== "";
}

/** Never throws. Rejects any shape that does not match the format in BUILD-PLAN.md §3.1. */
export function parseDrawing(v: unknown): Drawing | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const obj = v as Record<string, unknown>;

  const nodesRaw = obj.nodes;
  if (!nodesRaw || typeof nodesRaw !== "object" || Array.isArray(nodesRaw)) return null;
  const nodes = nodesRaw as Record<string, unknown>;
  const nodeIds = Object.keys(nodes);
  if (nodeIds.length === 0) return null;
  for (const id of nodeIds) {
    if (!isNonEmptyString(nodes[id])) return null;
  }

  const edgesRaw = obj.edges;
  if (!Array.isArray(edgesRaw)) return null;
  const edges: Edge[] = [];
  for (const e of edgesRaw) {
    if (!Array.isArray(e) || e.length < 2 || e.length > 3) return null;
    const [from, to, label] = e;
    if (typeof from !== "string" || !nodeIds.includes(from)) return null;
    if (typeof to !== "string" || !nodeIds.includes(to)) return null;
    if (label !== undefined && !isNonEmptyString(label)) return null;
    edges.push(label === undefined ? [from, to] : [from, to, label]);
  }

  const layRaw = obj.lay;
  if (!layRaw || typeof layRaw !== "object" || Array.isArray(layRaw)) return null;
  const L = layRaw as Record<string, unknown>;
  if (L.dir !== "TB" && L.dir !== "LR") return null;

  if (!Array.isArray(L.layers)) return null;
  const seen = new Set<string>();
  const layers: string[][] = [];
  for (const row of L.layers) {
    if (!Array.isArray(row) || row.length === 0) return null;
    const ids: string[] = [];
    for (const id of row) {
      if (typeof id !== "string" || !nodeIds.includes(id) || seen.has(id)) return null;
      seen.add(id);
      ids.push(id);
    }
    layers.push(ids);
  }
  if (seen.size !== nodeIds.length) return null; // every node exactly once

  let span: string[] | undefined;
  if (L.span !== undefined) {
    if (!Array.isArray(L.span) || !L.span.every((id) => typeof id === "string" && nodeIds.includes(id))) {
      return null;
    }
    span = L.span as string[];
  }

  let walls: string | undefined;
  if (L.walls !== undefined) {
    if (typeof L.walls !== "string" || !nodeIds.includes(L.walls)) return null;
    walls = L.walls;
  }

  let side: [string, string][] | undefined;
  if (L.side !== undefined) {
    if (!Array.isArray(L.side)) return null;
    const parsedSide: [string, string][] = [];
    for (const pair of L.side) {
      if (!Array.isArray(pair) || pair.length !== 2) return null;
      const [a, b] = pair;
      if (typeof a !== "string" || typeof b !== "string" || !nodeIds.includes(a) || !nodeIds.includes(b)) {
        return null;
      }
      parsedSide.push([a, b]);
    }
    side = parsedSide;
  }

  let shift: number | undefined;
  if (L.shift !== undefined) {
    if (typeof L.shift !== "number" || Number.isNaN(L.shift) || L.shift < 0 || L.shift > 1) return null;
    shift = L.shift;
  }

  let notes: [string[], string][] | undefined;
  if (obj.notes !== undefined) {
    if (!Array.isArray(obj.notes)) return null;
    const out: [string[], string][] = [];
    for (const nt of obj.notes) {
      if (!Array.isArray(nt) || nt.length !== 2) return null;
      const [ids, text] = nt;
      if (!Array.isArray(ids) || ids.length === 0) return null;
      for (const id of ids) {
        if (typeof id !== "string") return null;
        if (id !== "all" && !nodeIds.includes(id)) return null;
      }
      if (!isNonEmptyString(text)) return null;
      out.push([ids as string[], text]);
    }
    notes = out;
  }

  return {
    nodes: nodes as Record<string, string>,
    edges,
    lay: {
      dir: L.dir,
      layers,
      ...(span ? { span } : {}),
      ...(walls ? { walls } : {}),
      ...(side ? { side } : {}),
      ...(shift !== undefined ? { shift } : {}),
    },
    ...(notes ? { notes } : {}),
  };
}

/* -------------------------------------------------------- text metrics -- */

/** Sums font-metrics advances (drafted.html's canvas tw(), minus tracking — callers add that). */
export function textWidth(s: string, font: "label" | "mono", px: number): number {
  let units = 0;
  for (const ch of s) {
    units += font === "mono" ? MONO_ADVANCE : LABEL_ADVANCES[ch] ?? LABEL_ADVANCES["n"];
  }
  return (units / 1000) * px;
}

function central(font: "label" | "mono", px: number): number {
  return (font === "label" ? LABEL_CENTRAL : MONO_CENTRAL) * px;
}

/** drafted.html:1492-1500, wrap(). */
function wrapText(s: string, maxW: number, font: "label" | "mono", px: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of s.split(" ")) {
    const t = cur ? cur + " " + w : w;
    if (cur && textWidth(t, font, px) > maxW) {
      out.push(cur);
      cur = w;
    } else {
      cur = t;
    }
  }
  out.push(cur);
  return out;
}

function polylineLen(pts: [number, number][]): number {
  let len = 0;
  for (let j = 1; j < pts.length; j++) {
    len += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
  }
  return len;
}

/* -------------------------------------------------------------- layout -- */

interface NodeBox {
  id: string;
  li: number;
  k: number;
  n: number;
  span: boolean;
  lines: string[];
  w: number;
  h: number;
  lh: number;
  py: number;
  walls: boolean;
  c: number;
  m: number;
  cx: number;
  cy: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Lo {
  N: Record<string, NodeBox>;
  all: NodeBox[];
  TB: boolean;
  pad: number;
  cc: number;
  need: number;
}

/** drafted.html:1502-1542, layout(). */
function layout(d: Drawing, W: number, H: number, fs: number): Lo {
  const L = d.lay;
  const TB = L.dir === "TB";
  const pad = R(fs * 1.5);
  const nL = L.layers.length;
  const lh = R(fs * 1.3);
  const px = R(fs * 0.8);
  const py = R(fs * 0.55);
  const span = L.span || [];
  const N: Record<string, NodeBox> = {};
  const cross = TB ? W : H;

  L.layers.forEach((ids, li) => {
    ids.forEach((id, k) => {
      const n = ids.length;
      const isSpan = span.indexOf(id) >= 0;
      const maxW = TB
        ? isSpan
          ? cross - 2 * pad
          : Math.min(fs * 14, (cross - 2 * pad - (n - 1) * fs) / n)
        : Math.min(fs * 11, (W - 2 * pad - (nL - 1) * fs * 2.4) / nL);
      const lines = wrapText(d.nodes[id], maxW - 2 * px, "label", fs);
      const lw = Math.max(...lines.map((s) => textWidth(s, "label", fs)));
      const w = Math.ceil(Math.max(Math.min(maxW, lw + 2 * px), lw + 8));
      N[id] = {
        id,
        li,
        k,
        n,
        span: isSpan,
        lines,
        w,
        h: lines.length * lh + 2 * py,
        lh,
        py,
        walls: L.walls === id,
        c: 0,
        m: 0,
        cx: 0,
        cy: 0,
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 0,
      };
    });
    const reg0 = ids.filter((id) => !N[id].span).map((id) => N[id]);
    const mw = Math.max(0, ...reg0.map((n) => n.w));
    const mh = Math.max(0, ...reg0.map((n) => n.h));
    reg0.forEach((n) => {
      n.w = mw;
      n.h = mh;
    });
  });

  const all = Object.keys(N).map((k) => N[k]);
  const reg = all.filter((n) => !n.span);
  reg.forEach((n) => {
    n.c = pad + (cross - 2 * pad) * (n.n === 1 && L.shift ? L.shift : (n.k + 0.5) / n.n);
  });
  const ext0 = Math.min(...reg.map((n) => n.c - (TB ? n.w : n.h) / 2));
  const ext1 = Math.max(...reg.map((n) => n.c + (TB ? n.w : n.h) / 2));
  all.forEach((n) => {
    if (!n.span) return;
    n.c = (ext0 + ext1) / 2;
    if (TB) n.w = Math.max(n.w, ext1 - ext0);
    else n.h = Math.max(n.h, ext1 - ext0);
  });

  const sizes = L.layers.map((ids) => Math.max(...ids.map((id) => (TB ? N[id].h : N[id].w))));
  const sum = sizes.reduce((a, b) => a + b, 0);
  const avail = (TB ? H : W) - 2 * pad;
  const G = Math.max(fs * (TB ? 2.4 : 2.2), Math.min(fs * 6, (avail - sum) / Math.max(1, nL - 1)));
  const block = sum + G * (nL - 1);
  let m = pad + Math.max(0, (avail - block) / 2);
  L.layers.forEach((ids, li) => {
    ids.forEach((id) => {
      N[id].m = m + sizes[li] / 2;
    });
    m += sizes[li] + G;
  });
  all.forEach((n) => {
    n.cx = TB ? n.c : n.m;
    n.cy = TB ? n.m : n.c;
    n.x0 = R(n.cx - n.w / 2);
    n.y0 = R(n.cy - n.h / 2);
    n.x1 = n.x0 + R(n.w);
    n.y1 = n.y0 + R(n.h);
  });

  return { N, all, TB, pad, cc: pad + (cross - 2 * pad) * (L.shift || 0.5), need: block + 2 * pad };
}

/** drafted.html:1544-1561, route(). */
function route(d: Drawing, e: Edge, Lo: Lo, fs: number): [number, number][] {
  const A = Lo.N[e[0]];
  const B = Lo.N[e[1]];
  const side = (d.lay.side || []).some((s) => s[0] === e[0] && s[1] === e[1]);
  if (side) {
    const sx = Math.max(...Lo.all.map((n) => n.x1)) + R(fs * 2);
    return [
      [A.x1, A.cy],
      [sx, A.cy],
      [sx, B.cy],
      [B.x1, B.cy],
    ];
  }
  if (Lo.TB) {
    const ya = A.y1;
    const yb = B.y0;
    const inB = A.cx > B.x0 + 6 && A.cx < B.x1 - 6;
    const inA = B.cx > A.x0 + 6 && B.cx < A.x1 - 6;
    if (inB || inA) {
      const x = inB ? A.cx : B.cx;
      return [
        [x, ya],
        [x, yb],
      ];
    }
    const my = (ya + yb) / 2;
    return [
      [A.cx, ya],
      [A.cx, my],
      [B.cx, my],
      [B.cx, yb],
    ];
  }
  const xa = A.x1;
  const xb = B.x0;
  const inB2 = A.cy > B.y0 + 6 && A.cy < B.y1 - 6;
  const inA2 = B.cy > A.y0 + 6 && B.cy < A.y1 - 6;
  if (inB2 || inA2) {
    const y = inB2 ? A.cy : B.cy;
    return [
      [xa, y],
      [xb, y],
    ];
  }
  const mx = (xa + xb) / 2;
  return [
    [xa, A.cy],
    [mx, A.cy],
    [mx, B.cy],
    [xb, B.cy],
  ];
}

function ptsD(pts: [number, number][]): string {
  return "M" + pts.map((pt) => P5(pt[0]) + " " + P5(pt[1])).join("L");
}

function boxD(n: NodeBox): string {
  return "M" + (n.x0 + 0.5) + " " + (n.y0 + 0.5) + "H" + (n.x1 - 0.5) + "V" + (n.y1 - 0.5) + "H" + (n.x0 + 0.5) + "Z";
}

function arrowD(pts: [number, number][], fs: number): string {
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const dx = Math.sign(b[0] - a[0]);
  const dy = Math.sign(b[1] - a[1]);
  const len = R(fs * 0.55);
  const w = R(fs * 0.25);
  const tx = P5(b[0]);
  const ty = P5(b[1]);
  return (
    "M" + tx + " " + ty +
    "L" + (tx - dx * len - dy * w) + " " + (ty - dy * len - dx * w) +
    "L" + (tx - dx * len + dy * w) + " " + (ty - dy * len + dx * w) +
    "Z"
  );
}

/** drafted.html:1570-1579, wallsD(). Returns null when the box is too short for the hatching. */
function wallsD(n: NodeBox): string | null {
  const top = n.y0 + n.py + n.lines.length * n.lh + 10;
  const bot = n.y1 - 8;
  const wt = 6;
  const c = (bot - top - 2 * wt) / 3;
  if (c < 16) return null;
  let d = "";
  [top + c, top + 2 * c + wt].forEach((yRaw) => {
    const y = R(yRaw);
    d += "M" + (n.x0 + 2) + " " + (y + 0.5) + "H" + (n.x1 - 2) + "M" + (n.x0 + 2) + " " + (y + wt + 0.5) + "H" + (n.x1 - 2);
    for (let x = n.x0 + 4; x + wt < n.x1 - 2; x += 6) {
      d += "M" + x + " " + (y + wt) + "L" + (x + wt) + " " + y;
    }
  });
  return d;
}

/** drafted.html:1580-1588, nodeLabel(). */
function nodeLabelMark(n: NodeBox, fs: number, at: number): TextMark {
  const y0 = n.walls ? n.y0 + n.py : n.cy - (n.lines.length * n.lh) / 2;
  const firstY = R(y0 + n.lh / 2) + central("label", fs);
  return {
    kind: "text",
    cls: "d-label",
    font: "label",
    fontSize: fs,
    x: R(n.cx),
    y: firstY,
    anchor: "middle",
    lines: n.lines,
    lineHeight: n.lh,
    layer: "ink",
    anim: "set",
    at,
    dur: T(1 / 32),
  };
}

/** drafted.html:1589-1621, edgeLabels(). */
function edgeLabelMarks(d: Drawing, routes: [number, number][][], Lo: Lo, efs: number, W: number, at: number): Mark[] {
  const marks: Mark[] = [];
  const used: Record<string, boolean> = {};
  const bySrc: Record<string, number> = {};
  const byTgt: Record<string, number> = {};
  const segsAll: [[number, number], [number, number]][] = [];
  routes.forEach((pts) => {
    for (let j = 1; j < pts.length; j++) segsAll.push([pts[j - 1], pts[j]]);
  });
  function hits(x0: number, x1: number, y0: number, y1: number): boolean {
    return (
      segsAll.some((s) => {
        const sx0 = Math.min(s[0][0], s[1][0]);
        const sx1 = Math.max(s[0][0], s[1][0]);
        const sy0 = Math.min(s[0][1], s[1][1]);
        const sy1 = Math.max(s[0][1], s[1][1]);
        return sx1 >= x0 && sx0 <= x1 && sy1 >= y0 && sy0 <= y1;
      }) || Lo.all.some((n) => n.x1 >= x0 && n.x0 <= x1 && n.y1 >= y0 && n.y0 <= y1)
    );
  }
  d.edges.forEach((e) => {
    if (!e[2]) return;
    bySrc[e[0] + e[2]] = (bySrc[e[0] + e[2]] || 0) + 1;
    byTgt[e[1] + e[2]] = (byTgt[e[1] + e[2]] || 0) + 1;
  });
  d.edges.forEach((e, k) => {
    const label = e[2];
    if (!label) return;
    const pts = routes[k];
    const segs: [[number, number], [number, number]][] = [];
    for (let j = 1; j < pts.length; j++) segs.push([pts[j - 1], pts[j]]);
    let seg: [[number, number], [number, number]];
    if ((bySrc[e[0] + label] || 0) > 1) {
      if (used["s" + e[0] + label]) return;
      used["s" + e[0] + label] = true;
      seg = segs[0];
    } else if ((byTgt[e[1] + label] || 0) > 1) {
      if (used["t" + e[1] + label]) return;
      used["t" + e[1] + label] = true;
      seg = segs[segs.length - 1];
    } else {
      seg = segs.length === 1 ? segs[0] : segs[1];
    }
    const w = textWidth(label, "mono", efs) + label.length * efs * 0.02 + 2;
    const a = seg[0];
    const b = seg[1];
    let x: number;
    let y: number;
    let anchor: "start" | "middle" | "end";
    let base: "central" | "auto";
    let knock = false;
    if (a[0] === b[0]) {
      y = (a[1] + b[1]) / 2;
      base = "central";
      x = a[0] + 7;
      anchor = "start";
      if (x + w > W - 8 || hits(x, x + w, y - 5, y + 5)) {
        x = a[0] - 7;
        anchor = "end";
      }
      if (anchor === "end" && x - w < 8) {
        x = Math.min(Math.max(a[0], w / 2 + 6), W - w / 2 - 6);
        anchor = "middle";
        knock = true;
      }
    } else {
      x = (a[0] + b[0]) / 2;
      y = a[1] - 6;
      anchor = "middle";
      base = "auto";
    }
    const finalY = base === "central" ? R(y) + central("mono", efs) : R(y);
    if (knock) {
      marks.push({
        kind: "rect",
        cls: "c-knock",
        x: R(x - w / 2 - 3),
        y: R(y - efs * 0.8),
        w: R(w + 6),
        h: R(efs * 1.6),
        layer: "ink",
        anim: "set",
        at,
        dur: T(1 / 32),
      });
    }
    marks.push({
      kind: "text",
      cls: "d-elabel",
      font: "mono",
      fontSize: efs,
      x: R(x),
      y: finalY,
      anchor,
      lines: [label],
      lineHeight: R(efs * 1.45),
      layer: "ink",
      anim: "set",
      at,
      dur: T(1 / 32),
    });
  });
  return marks;
}

function list(a: string[]): string {
  return a.length < 2 ? a[0] : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}

/** drafted.html:1622-1631, describe(). Exact string match required (.dia-text / aria-label). */
export function describe(d: Drawing, name: string): string {
  const groups: { to: string; label?: string; from: string[] }[] = [];
  const idx: Record<string, number> = {};
  d.edges.forEach((e) => {
    const key = e[1] + "|" + (e[2] || "");
    if (!(key in idx)) {
      idx[key] = groups.length;
      groups.push({ to: d.nodes[e[1]], label: e[2], from: [] });
    }
    groups[idx[key]].from.push(d.nodes[e[0]]);
  });
  return (
    "Architecture of " +
    name +
    ": " +
    groups.map((g) => list(g.from) + " to " + g.to + (g.label ? " (" + g.label + ")" : "")).join("; ") +
    "."
  );
}

/* --------------------------------------------------------- orchestrator -- */

/** drafted.html:1633-1729, drawDiagram() minus DOM: returns marks + the schedule's end instead of animating. */
export function drawLayout(d: Drawing, o: DrawOptions): { W: number; H: number; marks: Mark[]; end: number } {
  const { W, fs } = o;
  let H = o.H;
  let Lo = layout(d, W, H, fs);
  if (Lo.need > H) {
    H = Math.ceil(Lo.need);
    Lo = layout(d, W, H, fs);
  }

  const notes = o.notes ? d.notes ?? [] : [];
  const rowH = R(fs * 2.6);
  const nlh = R(o.nfs * 1.45);
  function nw(s: string): number {
    return textWidth(s, "mono", o.nfs) + s.length * o.nfs * 0.02 + 2;
  }
  const rowsN: { y: number; lines: string[] }[] = [];
  let ny = H;
  notes.forEach((nt) => {
    const ls = nw(nt[1]) > W - 12 ? wrapText(nt[1], W - 24, "mono", o.nfs) : [nt[1]];
    rowsN.push({ y: R(ny + rowH * 0.7 + (ls.length - 1) * nlh), lines: ls });
    ny += rowH + (ls.length - 1) * nlh;
  });
  const HH = notes.length ? ny + R(fs * 0.6) : H;

  function ext(ids: string[]): [number, number] {
    const ns = ids[0] === "all" ? Lo.all : ids.map((id) => Lo.N[id]);
    return [Math.min(...ns.map((n) => n.x0)), Math.max(...ns.map((n) => n.x1))];
  }

  const marks: Mark[] = [];
  let jobEnd = 0;
  function add(m: Mark): number {
    jobEnd = Math.max(jobEnd, m.at + m.dur);
    marks.push(m);
    return m.at + m.dur;
  }
  function pen(cls: string, dStr: string, at: number, len: number): number {
    return add({ kind: "path", cls, d: dStr, layer: "cons", anim: "pen", at, dur: len / SPEED });
  }
  function ink(cls: string, dStr: string, at: number): number {
    return add({ kind: "path", cls, d: dStr, layer: "ink", anim: "ink", at, dur: T(1 / 16) });
  }
  function setPath(cls: string, dStr: string, at: number): number {
    return add({ kind: "path", cls, d: dStr, layer: "ink", anim: "set", at, dur: T(1 / 32) });
  }
  function setRect(cls: string, x: number, y: number, w: number, h: number, at: number): number {
    return add({ kind: "rect", cls, x, y, w, h, layer: "ink", anim: "set", at, dur: T(1 / 32) });
  }
  function setText(
    cls: string,
    font: "label" | "mono",
    fontSize: number,
    x: number,
    y: number,
    anchor: "start" | "middle" | "end",
    lines: string[],
    lineHeight: number,
    at: number
  ): number {
    return add({ kind: "text", cls, font, fontSize, x, y, anchor, lines, lineHeight, layer: "ink", anim: "set", at, dur: T(1 / 32) });
  }

  // 1. construction guides: registration marks, the layer axes, the centre axis
  ([
    [8, 8],
    [W - 8, 8],
    [8, HH - 8],
    [W - 8, HH - 8],
  ] as [number, number][]).forEach((c) => {
    pen("c", "M" + (c[0] - 5) + " " + (c[1] + 0.5) + "H" + (c[0] + 5) + "M" + (c[0] + 0.5) + " " + (c[1] - 5) + "V" + (c[1] + 5), 0, 20);
  });
  const axes = new Set<number>();
  Lo.all.forEach((n) => axes.add(R(n.m)));
  axes.forEach((m) => {
    const dStr = Lo.TB ? "M0 " + (m + 0.5) + "H" + W : "M" + (m + 0.5) + " 0V" + H;
    pen("c c-soft", dStr, 0, Lo.TB ? W : H);
  });
  {
    const dStr = Lo.TB ? "M" + P5(Lo.cc) + " 0V" + H : "M0 " + P5(Lo.cc) + "H" + W;
    pen("c c-soft", dStr, 0, Lo.TB ? H : W);
  }

  // 2. boxes, layer by layer, in construction blue
  Lo.all.forEach((n) => {
    const len = 2 * (n.x1 - n.x0 - 1) + 2 * (n.y1 - n.y0 - 1);
    pen("c", boxD(n), GRID + n.li * T(1 / 32), len);
  });

  // 3. connectors
  const routes = d.edges.map((e) => route(d, e, Lo, fs));
  const tE = q(jobEnd);
  routes.forEach((pts, k) => {
    pen("c", ptsD(pts), tE + Lo.N[d.edges[k][0]].li * T(1 / 32), polylineLen(pts));
  });
  const bottom = Math.max(...Lo.all.map((n) => n.y1));
  notes.forEach((nt, k) => {
    const [extLo, extHi] = ext(nt[0]);
    const y = rowsN[k].y;
    const dStr =
      "M" + P5(extLo) + " " + R(bottom + 6) + "V" + (y + 6) + "M" + P5(extHi) + " " + R(bottom + 6) + "V" + (y + 6);
    pen("c c-soft", dStr, tE, 2 * Math.abs(y - bottom));
  });

  // 4. plain labels (node labels now; edge labels are visually moved on top of the ink in step 5)
  const tL = q(jobEnd);
  Lo.all.forEach((n) => {
    add(nodeLabelMark(n, fs, tL));
  });
  const elabels = edgeLabelMarks(d, routes, Lo, o.efs, W, tL);
  elabels.forEach((m) => add(m));

  // 5. ink: fast and decisive
  const tK = tL + GRID;
  Lo.all.forEach((n) => {
    ink("d-box", boxD(n), tK + n.li * T(1 / 32));
  });
  if (d.lay.walls) {
    const n = Lo.N[d.lay.walls];
    const wd = wallsD(n);
    if (wd) add({ kind: "path", cls: "d-wall", d: wd, layer: "ink", anim: "ink", at: tK + n.li * T(1 / 32) + T(1 / 32), dur: T(1 / 16) });
  }
  const tKE = q(jobEnd);
  routes.forEach((pts, k) => {
    const at = tKE + Lo.N[d.edges[k][0]].li * T(1 / 32);
    const end = ink("d-edge", ptsD(pts), at);
    setPath("d-arrow", arrowD(pts, fs), end);
  });

  // 6. real facts as dimensions (sheet only)
  const tN = q(jobEnd);
  notes.forEach((nt, k) => {
    const [extLo, extHi] = ext(nt[0]);
    const y = rowsN[k].y + 0.5;
    const x0 = P5(extLo);
    const x1 = P5(extHi);
    const ls = rowsN[k].lines;
    const dStr =
      "M" + x0 + " " + y + "H" + x1 +
      "M" + (x0 - 4) + " " + (y + 4) + "l8 -8M" + (x1 - 4) + " " + (y + 4) + "l8 -8" +
      "M" + x0 + " " + (y - 6) + "V" + (y + 6) + "M" + x1 + " " + (y - 6) + "V" + (y + 6);
    const atIn = tN + k * GRID;
    ink("d-dim", dStr, atIn);

    const w = Math.max(...ls.map(nw));
    let tx: number;
    let ty = y + 4;
    let anchor: "start" | "middle" | "end" = "start";
    let kx: number;
    if (ls.length === 1 && w + 24 < x1 - x0) {
      tx = (x0 + x1) / 2;
      anchor = "middle";
      ty = y - 6;
      kx = tx - w / 2;
    } else if (ls.length === 1 && x1 + 10 + w < W - 4) {
      tx = x1 + 10;
      kx = tx;
    } else if (ls.length === 1 && x0 - 10 - w > 4) {
      tx = x0 - 10;
      anchor = "end";
      kx = tx - w;
    } else {
      tx = Math.min(Math.max((x0 + x1) / 2, w / 2 + 4), W - w / 2 - 4);
      anchor = "middle";
      ty = y - 6 - (ls.length - 1) * nlh;
      kx = tx - w / 2;
    }
    const atSet = atIn + T(1 / 16);
    setRect("c-knock", R(kx - 3), R(ty - o.nfs), R(w + 6), o.nfs + 5 + (ls.length - 1) * nlh, atSet);
    setText("d-note", "mono", o.nfs, R(tx), R(ty), anchor, ls, nlh, atSet);
  });

  return { W, H: HH, marks, end: jobEnd };
}
