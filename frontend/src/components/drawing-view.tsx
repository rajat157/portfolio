/**
 * Renders a drawLayout() result as SVG. No "use client" — it renders on the
 * server (SSR/no-JS) or the client identically. A future client wrapper
 * (SheetFigure, P3) is responsible for adding the "drafting" class on mount
 * and removing it after `end + 34`ms; absent that, the drawing renders fully
 * inked and static, which is also the no-JS resting state.
 * See design/drafted/BUILD-PLAN.md §3.2.
 */
import type { Mark } from "@/lib/drawing";

export function DrawingView({
  W,
  H,
  marks,
  project,
  ariaLabel,
  drafting = false,
}: {
  W: number;
  H: number;
  marks: Mark[];
  project: string;
  ariaLabel: string;
  drafting?: boolean;
}) {
  const cons = marks.filter((m) => m.layer === "cons");
  const ink = marks.filter((m) => m.layer === "ink");
  return (
    <svg
      className={drafting ? "dia drafting" : "dia"}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      data-project={project}
      data-state={drafting ? "drafting" : "inked"}
      role="img"
      aria-label={ariaLabel}
    >
      <g className="cons">
        {cons.map((m, i) => (
          <MarkEl key={i} m={m} />
        ))}
      </g>
      <g>
        {ink.map((m, i) => (
          <MarkEl key={i} m={m} />
        ))}
      </g>
    </svg>
  );
}

function animClass(anim: Mark["anim"]): string {
  return anim === "pen" ? "a-pen" : anim === "ink" ? "a-ink" : anim === "set" ? "a-set" : "";
}

function MarkEl({ m }: { m: Mark }) {
  const cls = [m.cls, animClass(m.anim)].filter(Boolean).join(" ");
  const style = m.anim ? ({ "--at": m.at + "ms", "--dur": m.dur + "ms" } as React.CSSProperties) : undefined;

  if (m.kind === "path") {
    return <path className={cls} d={m.d} style={style} pathLength={m.anim === "pen" || m.anim === "ink" ? 1 : undefined} />;
  }
  if (m.kind === "rect") {
    return <rect className={cls} x={m.x} y={m.y} width={m.w} height={m.h} style={style} />;
  }
  return (
    <text className={cls} textAnchor={m.anchor} fontSize={m.fontSize} style={style}>
      {m.lines.map((line, j) => (
        <tspan key={j} x={m.x} y={m.y + j * m.lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
