// "Who I am" (round 2, the canvas board "Sections A"): how I work, one way per stop (its icon drawn on, a big title,
// the line and my note), then a stop in numbers that count up as it opens. Server-rendered as the index over four
// stacked stops, which is the whole section with no JS or under reduced motion; Steps pins it and steps through the
// stops as you scroll.
import { HOME } from "@/content/home";
import { Steps } from "@/components/home/steps";

// the Icons board's "Way" drawings (24-unit boxes, like the offerings'), drawn on stroke by stroke as a stop opens
const WAY_ICONS = [
  ["M4 7h10", "M11 4l3 3-3 3", "M20 17H10", "M13 14l-3 3 3 3"],
  ["M12 4l8 4-8 4-8-4z", "M4 12l8 4 8-4", "M4 16l8 4 8-4"],
  ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M10 8.5v7l6-3.5z"],
];

const two = (i: number) => String(i + 1).padStart(2, "0");

export function Who({ counts }: { counts: readonly { label: string; value: string | null }[] }) {
  const W = HOME.who;
  const stops = [...W.ways.map((w) => w.title), W.numbers];

  return (
    <section className="sect steps who" id="who" aria-labelledby="who-h" style={{ "--n": stops.length } as React.CSSProperties}>
      <div className="steps-pin">
        <div className="container gv steps-grid">
          <div className="steps-side">
            <h2 id="who-h" className="t-h2" data-cons="text">
              Who I am
            </h2>
            <p className="who-body">{W.intro}</p>
            <ol className="steps-list">
              {stops.map((s, i) => (
                <li key={s}>
                  <a className="steps-i" href={`#who-${i + 1}`}>
                    <span className="num">{two(i)}</span>
                    <span className="steps-i-t">{s}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="lab steps-count" aria-hidden="true">
              <span className="num steps-no">01</span> / {two(stops.length - 1)}
            </p>
          </div>

          <div className="steps-stops">
            {W.ways.map((w, i) => (
              <article className="steps-stop" id={`who-${i + 1}`} key={w.title} aria-labelledby={`who-${i + 1}-h`}>
                <p className="lab">
                  {W.wayLab} · {two(i)}
                </p>
                <svg className="steps-ico who-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
                  {WAY_ICONS[i].map((d) => (
                    <path key={d} pathLength={1} d={d} />
                  ))}
                </svg>
                <h3 className="who-t" id={`who-${i + 1}-h`} tabIndex={-1}>
                  {w.title}.
                </h3>
                <p className="who-line">{w.body}</p>
                {/* in a div: a stop's draw-in moves its children, and that transform would replace the note's tilt */}
                <div className="who-note">
                  <p className="hand">{w.note}</p>
                </div>
              </article>
            ))}
            <article className="steps-stop" id={`who-${stops.length}`} aria-labelledby={`who-${stops.length}-h`}>
              <h3 className="lab who-n" id={`who-${stops.length}-h`} tabIndex={-1}>
                {W.numbers}
              </h3>
              <dl className="who-counts">
                {counts.map((c) => (
                  <div key={c.label}>
                    <dt className="lab">{c.label}</dt>
                    <dd className="num" data-count="">
                      {c.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>
        </div>
      </div>
      <Steps id="who" />
    </section>
  );
}
