import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface FlowNode {
  node: string;
  detail?: string;
  kind?: "external" | "highlight";
  stores?: string[];
}

export interface FlowEdge {
  edge: string | string[];
}

export interface FlowLanes {
  lanes: FlowLaneItem[][];
}

export interface FlowLegend {
  legend: string;
}

export type FlowLaneItem = FlowNode | FlowEdge;
// FlowItem minus FlowLegend — what a diagram actually walks and renders, once the
// (at most one, trailing) legend has been split off by FlowDiagram.
type FlowSeqItem = FlowNode | FlowEdge | FlowLanes;
export type FlowItem = FlowSeqItem | FlowLegend;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Kind = "node" | "edge" | "lanes" | "legend";

function classify(value: unknown): Kind | null {
  if (!isPlainObject(value)) return null;
  const flags = (["node", "edge", "lanes", "legend"] as const).filter((k) => k in value);
  return flags.length === 1 ? flags[0] : null;
}

function validateNode(value: Record<string, unknown>): boolean {
  if (typeof value.node !== "string" || value.node.length === 0) return false;
  if ("detail" in value && typeof value.detail !== "string") return false;
  if ("kind" in value && value.kind !== "external" && value.kind !== "highlight") return false;
  if ("stores" in value) {
    const stores = value.stores;
    if (!Array.isArray(stores)) return false;
    if (!stores.every((s) => typeof s === "string" && s.length > 0)) return false;
  }
  return true;
}

function validateEdge(value: Record<string, unknown>): boolean {
  const edge = value.edge;
  if (typeof edge === "string") return edge.length > 0;
  if (Array.isArray(edge)) {
    return edge.length > 0 && edge.every((label) => typeof label === "string" && label.length > 0);
  }
  return false;
}

function validateLegend(value: Record<string, unknown>): boolean {
  return typeof value.legend === "string" && value.legend.length > 0;
}

// A lane's own sequence: nodes and edges only (no nested lanes, no legend). An
// edge must sit between two non-edge items — no leading, trailing or
// consecutive edges — so a valid lane necessarily starts and ends with a node.
function validateLaneSequence(seq: unknown): FlowLaneItem[] | null {
  if (!Array.isArray(seq) || seq.length === 0) return null;
  const kinds = seq.map(classify);
  if (kinds.some((k) => k === null || k === "lanes" || k === "legend")) return null;
  if (kinds[0] === "edge" || kinds[kinds.length - 1] === "edge") return null;
  for (let i = 1; i < kinds.length; i++) {
    if (kinds[i] === "edge" && kinds[i - 1] === "edge") return null;
  }
  const result: FlowLaneItem[] = [];
  for (let i = 0; i < seq.length; i++) {
    const kind = kinds[i]!;
    const raw = seq[i] as Record<string, unknown>;
    const item =
      kind === "node"
        ? validateNode(raw)
          ? (raw as unknown as FlowNode)
          : null
        : validateEdge(raw)
          ? (raw as unknown as FlowEdge)
          : null;
    if (item === null) return null;
    result.push(item);
  }
  return result;
}

function buildLanesItem(raw: Record<string, unknown>): FlowLanes | null {
  const lanesRaw = raw.lanes;
  if (!Array.isArray(lanesRaw) || lanesRaw.length < 2) return null;
  const lanes: FlowLaneItem[][] = [];
  for (const lane of lanesRaw) {
    const validLane = validateLaneSequence(lane);
    if (!validLane) return null;
    lanes.push(validLane);
  }
  return { lanes };
}

// The top-level sequence: nodes, edges, lanes, and (at most one, trailing)
// legend. Must start with a node, so a legend-only or lanes-first spec can
// never render an empty or dangling diagram. As in a lane, an edge must sit
// between two non-edge items — no trailing or consecutive edges (a leading
// edge is already excluded by the "starts with a node" rule).
function validateTopSequence(seq: unknown): FlowItem[] | null {
  if (!Array.isArray(seq) || seq.length === 0) return null;
  const kinds = seq.map(classify);
  if (kinds.some((k) => k === null)) return null;
  if (kinds[0] !== "node") return null;
  for (let i = 0; i < kinds.length - 1; i++) {
    if (kinds[i] === "legend") return null;
  }
  if (kinds[kinds.length - 1] === "edge") return null;
  for (let i = 1; i < kinds.length; i++) {
    if (kinds[i] === "edge" && kinds[i - 1] === "edge") return null;
  }
  const result: FlowItem[] = [];
  for (let i = 0; i < seq.length; i++) {
    const kind = kinds[i]!;
    const raw = seq[i] as Record<string, unknown>;
    let item: FlowItem | null;
    if (kind === "node") item = validateNode(raw) ? (raw as unknown as FlowNode) : null;
    else if (kind === "edge") item = validateEdge(raw) ? (raw as unknown as FlowEdge) : null;
    else if (kind === "legend") item = validateLegend(raw) ? (raw as unknown as FlowLegend) : null;
    else item = buildLanesItem(raw);
    if (item === null) return null;
    result.push(item);
  }
  return result;
}

/** Parses a `flow` fenced-block body into a validated FlowItem list. Returns null on any invalid input; never throws. */
export function parseFlow(source: string): FlowItem[] | null {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return null;
  }
  return validateTopSequence(data);
}

// --- Rendering ---

// Flowing dashed line colour, used for every connector and bracket segment:
// muted but readable against the dark card background, subordinate to the
// node cards.
const LINE_CLASS = "text-muted-foreground/50";

// A short animated dashed segment. Rendered as a `repeating-linear-gradient`
// background (real px dash sizing) rather than an SVG stroke, so its dash
// length never distorts regardless of the element's actual rendered width —
// unlike a stretched SVG viewBox, a CSS background tiles at a fixed px size.
function FlowLine({
  axis,
  delay,
  className,
  style,
}: {
  axis: "vertical" | "horizontal";
  delay: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute",
        LINE_CLASS,
        axis === "vertical" ? "motion-safe:animate-flow-dash-y" : "motion-safe:animate-flow-dash-x",
        className
      )}
      style={{
        ...(axis === "vertical" ? { width: 2 } : { height: 2 }),
        backgroundImage:
          axis === "vertical"
            ? "repeating-linear-gradient(to bottom, currentColor 0 6px, transparent 6px 12px)"
            : "repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 12px)",
        backgroundSize: axis === "vertical" ? "2px 12px" : "12px 2px",
        animationDelay: `${delay}s`,
        ...style,
      }}
    />
  );
}

// Fixed-size arrowhead (10x6px, never inside a scaled/stretched SVG) — the
// same markup and dimensions wherever a connector or bracket stub meets a
// node, so every arrow in the diagram renders identically.
function FlowArrow({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      className={cn(LINE_CLASS, className)}
      style={style}
      aria-hidden="true"
    >
      <path d="M0,0 L5,6 L10,0 Z" fill="currentColor" />
    </svg>
  );
}

// Colour-codes a store's dot by its first word; falls back to a neutral tint
// for anything else. Reuses the site's existing chart-color theme tokens
// rather than introducing new palette values.
function storeDotClass(label: string): string {
  const key = label.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (key === "kafka") return "bg-chart-1";
  if (key === "redis") return "bg-chart-2";
  if (key === "postgresql") return "bg-chart-3";
  return "bg-muted-foreground";
}

type Row =
  | { type: "node"; node: FlowNode }
  | { type: "lanes"; lanes: Row[][]; topDelay: number; bottomDelay: number }
  | { type: "connector"; labels?: string[]; delay: number };

// Plain data transform (not a component): walks the whole tree once, so connector
// flow delays cascade top-to-bottom across the diagram, lanes included, before any
// JSX is produced.
function buildRows(items: FlowSeqItem[], counter: { n: number }): Row[] {
  const rows: Row[] = [];
  let pendingLabels: string[] | undefined;
  for (const item of items) {
    if ("edge" in item) {
      pendingLabels = Array.isArray(item.edge) ? item.edge : [item.edge];
      continue;
    }
    if (rows.length > 0) {
      rows.push({ type: "connector", labels: pendingLabels, delay: counter.n * 0.15 });
      counter.n += 1;
    }
    pendingLabels = undefined;
    if ("node" in item) {
      rows.push({ type: "node", node: item });
    } else {
      const topDelay = counter.n * 0.15;
      counter.n += 1;
      const lanes = item.lanes.map((lane) => buildRows(lane, counter));
      const bottomDelay = counter.n * 0.15;
      counter.n += 1;
      rows.push({ type: "lanes", lanes, topDelay, bottomDelay });
    }
  }
  return rows;
}

function Connector({ labels, delay }: { labels?: string[]; delay: number }) {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative" style={{ width: 12, height: 28 }} aria-hidden="true">
        <FlowLine axis="vertical" delay={delay} className="left-1/2 top-0 -translate-x-1/2" style={{ height: 21 }} />
        <FlowArrow className="absolute left-1/2 -translate-x-1/2" style={{ top: 21 }} />
      </div>
      {labels && labels.length > 0 && (
        <div className="mt-1 flex max-w-64 min-w-0 flex-wrap justify-center gap-1">
          {labels.map((label, i) => (
            <span
              key={i}
              className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] break-words text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({ node }: { node: FlowNode }) {
  return (
    <div
      className={cn(
        // Top-aligned (not centered): when a lane grid stretches this card to
        // match a taller sibling, content starts flush at a shared top edge
        // instead of splitting the leftover space — centering would split it
        // by a fractional, per-column remainder, drifting the two cards'
        // rendered top edge by a subpixel or two.
        "mx-auto flex w-fit min-w-0 max-w-64 flex-col rounded-lg border bg-card px-4 py-3 text-center",
        node.kind === "external" && "border-dashed",
        node.kind === "highlight" && "border-primary/60 ring-1 ring-primary/30"
      )}
    >
      <p className="break-words text-sm font-medium text-foreground">{node.node}</p>
      {node.detail && <p className="mt-0.5 break-words text-xs text-muted-foreground">{node.detail}</p>}
      {node.stores && node.stores.length > 0 && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {node.stores.map((store, i) => (
            <span
              key={i}
              className="inline-flex max-w-full items-center gap-1 break-words rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] leading-none text-foreground/75"
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", storeDotClass(store))} aria-hidden="true" />
              {store}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Bracket geometry, in real px (never stretched — every shape below is either
// a fixed-size SVG or a CSS line whose dash size is independent of its length).
const ROW_H = 24; // bracket row height
const CORNER = 8; // corner curve size
const GAP_PX = 16; // must match the lane grid's `gap-4` column gap
const HALF_GAP = GAP_PX / 2;

// A small (8x24px, 1:1 viewBox — never scaled) rounded joint between a lane's
// vertical stub and the shared horizontal bar. Only the first and last lane
// need one; inner lanes just cross the bar in a straight line, no bend.
function cornerPath(curvesToward: "left" | "right", barAtTop: boolean): string {
  const curvesRight = curvesToward === "right";
  const near = curvesRight ? 0 : CORNER; // stub-side x (the cell's own centre)
  const far = curvesRight ? CORNER : 0; // bar-side x (extends toward this edge)
  const stubY = barAtTop ? ROW_H : 0; // where the straight stub continues toward the card
  const bendY = barAtTop ? CORNER : ROW_H - CORNER;
  const barY = barAtTop ? 0 : ROW_H;
  return `M${near},${stubY} L${near},${bendY} Q${near},${barY} ${far},${barY}`;
}

// One lane's contribution to the split/merge bracket, rendered as a grid cell
// in the SAME lane grid as the cards — so its vertical stub sits at `left:
// 50%` of its own real column (exactly the card's centre, automatically, no
// percentage math against the bracket's total width) and its horizontal run
// extends a fixed half-gap into the real grid gap to meet its neighbour.
function BracketCell({
  index,
  count,
  position,
  delay,
  style,
}: {
  index: number;
  count: number;
  position: "top" | "bottom";
  delay: number;
  style?: CSSProperties;
}) {
  const barAtTop = position === "top";
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const extendLeft = index > 0;
  const extendRight = index < count - 1;

  return (
    <div
      className="relative min-w-0"
      style={{ height: ROW_H, ...style }}
      aria-hidden="true"
      data-bracket-lane={index}
      data-bracket-position={position}
    >
      {(extendLeft || extendRight) && (
        <FlowLine
          axis="horizontal"
          delay={delay}
          className={barAtTop ? "top-0" : "bottom-0"}
          style={{ left: extendLeft ? -HALF_GAP : "50%", right: extendRight ? -HALF_GAP : "50%" }}
        />
      )}
      <FlowLine
        axis="vertical"
        delay={delay}
        className="left-1/2 -translate-x-1/2"
        style={{ top: 0, height: ROW_H }}
      />
      {(isFirst || isLast) && (
        <svg
          width={CORNER}
          height={ROW_H}
          viewBox={`0 0 ${CORNER} ${ROW_H}`}
          className={cn("absolute", LINE_CLASS)}
          style={{ [isFirst ? "left" : "right"]: "50%", top: 0 }}
        >
          <path
            d={cornerPath(isFirst ? "right" : "left", barAtTop)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {barAtTop && <FlowArrow className="absolute left-1/2 -translate-x-1/2" style={{ top: ROW_H - 6 }} />}
    </div>
  );
}

// Renders every lane as ONE shared CSS grid (not independent columns), with
// the split/merge brackets as its own top/bottom rows: each lane's <ol> is
// `display: contents`, so its <li>/connector items become direct grid items
// placed by row index. Paired items — cards, connectors, and now the bracket
// stubs too — land in the same grid row and column as their card, so nothing
// needs its position recomputed by hand at any width.
function Lanes({
  lanes,
  topDelay,
  bottomDelay,
  style,
}: {
  lanes: Row[][];
  topDelay: number;
  bottomDelay: number;
  style?: CSSProperties;
}) {
  const n = lanes.length;
  const maxRows = Math.max(...lanes.map((l) => l.length));
  return (
    <li style={style}>
      <span className="sr-only">{`${n} parallel branches`}</span>
      <div className="mx-auto grid max-w-[38rem] gap-4" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => (
          <BracketCell
            key={`bracket-top-${i}`}
            index={i}
            count={n}
            position="top"
            delay={topDelay}
            style={{ gridColumn: i + 1, gridRow: 1 }}
          />
        ))}
        {lanes.map((laneRows, i) => (
          <ol key={i} className="contents">
            <li className="sr-only" style={{ gridColumn: i + 1, gridRow: 2 }}>{`Branch ${i + 1} of ${n}`}</li>
            {laneRows.map((row, j) => (
              <RowItem key={j} row={row} style={{ gridColumn: i + 1, gridRow: j + 2 }} />
            ))}
          </ol>
        ))}
        {Array.from({ length: n }, (_, i) => (
          <BracketCell
            key={`bracket-bottom-${i}`}
            index={i}
            count={n}
            position="bottom"
            delay={bottomDelay}
            style={{ gridColumn: i + 1, gridRow: maxRows + 2 }}
          />
        ))}
      </div>
    </li>
  );
}

function RowItem({ row, style }: { row: Row; style?: CSSProperties }) {
  if (row.type === "connector") {
    const hasLabels = Boolean(row.labels && row.labels.length > 0);
    // A connector is decorative (line + arrow) unless it carries a label,
    // which must stay readable — so it's aria-hidden only when unlabeled.
    return (
      <li style={style} className="min-w-0" aria-hidden={hasLabels ? undefined : true}>
        <Connector labels={row.labels} delay={row.delay} />
      </li>
    );
  }
  if (row.type === "node") {
    // `flex` (rather than the default block box) so the NodeCard stretches to
    // fill the li's height — which the grid has already stretched to match its
    // row's tallest paired card, keeping lane siblings visually equal-height.
    return (
      <li style={style} className={cn("min-w-0", style && "flex")}>
        <NodeCard node={row.node} />
      </li>
    );
  }
  return <Lanes lanes={row.lanes} topDelay={row.topDelay} bottomDelay={row.bottomDelay} style={style} />;
}

export function FlowDiagram({ items }: { items: FlowItem[] }) {
  const last = items[items.length - 1];
  const legend = last && "legend" in last ? last.legend : null;
  const flowItems = (legend ? items.slice(0, -1) : items) as FlowSeqItem[];
  const rows = buildRows(flowItems, { n: 0 });
  return (
    <figure
      aria-label="System design flow diagram"
      className="my-6 rounded-lg border border-border bg-card/30 p-4 sm:p-6"
    >
      <ol className="flex flex-col items-stretch">
        {rows.map((row, i) => (
          <RowItem key={i} row={row} />
        ))}
      </ol>
      {legend && (
        <figcaption className="mt-4 break-words text-center text-xs text-muted-foreground">{legend}</figcaption>
      )}
    </figure>
  );
}
