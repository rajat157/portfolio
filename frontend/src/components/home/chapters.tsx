// "Who I am" and "What I build" as chapters (round 2, the canvas board "Sections A", picked 2026-10-15): a rail with a
// tick per stop, and one idea per stop: the three ways I work (each with its drawing, a big title, the line and my
// note), the numbers, then the six offerings three to a stop. Server-rendered as the rail's index over the stops,
// stacked, which is the whole section with no JS or under reduced motion; Steps pins it, steps through the stops as
// you scroll and lets a scroll come to rest on each one.
import { HOME } from "@/content/home";
import { Steps } from "@/components/home/steps";

// drafting-stroke drawings (24-unit boxes), drawn on stroke by stroke as a stop opens
const WAY_ICONS = [
  // understand the work first: the route the work actually takes, start to finish
  ["M3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0", "M7 18h7.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H17", "M17 3.5l3 2.5-3 2.5z"],
  // build the whole thing: database to screen
  [
    "M2.5 6.5c0-1.4 1.8-2.5 4-2.5s4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5z M2.5 6.5v11c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5v-11 M2.5 12c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5",
    "M10.5 11h3",
    "M13.5 6h8v9h-8z",
    "M17.5 15v3 M15.5 18h4",
  ],
  // leave it runnable: the key, handed over
  ["M3 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M11 12h10", "M18 12v3.5 M15 12v2.5"],
];

const OFFER_ICONS: Record<string, string[]> = {
  // each person on one platform
  "Portals and platforms": [
    "M4 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M10 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M16 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "M3 12.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5 M9 12.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5 M15 12.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5",
    "M2 15h20v5H2z",
  ],
  // the sheet, ticked off
  "Internal tools": ["M4 5h16v14H4z", "M4 10h16", "M10 10v9", "M13 15l2 2 3-4"],
  // a live line
  "Real-time data": ["M3 19h18", "M3 15l4-5 4 3 3-6 3 4", "M19.5 11a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0"],
  // a page you edit
  "Sites you run yourself": ["M3 5h18v14H3z", "M3 9h18", "M9 17l6-6 2 2-6 6H9z"],
  // an assistant that does the work
  "AI where it helps": ["M3 4h18v12H10l-4 4v-4H3z", "M12 6.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"],
  // a second look
  "A second look": ["M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z", "M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0"],
};

function Drawing({ paths, className }: { paths: string[]; className?: string }) {
  return (
    <svg className={className ? `steps-ico ${className}` : "steps-ico"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
      {paths.map((d) => (
        <path key={d} pathLength={1} d={d} />
      ))}
    </svg>
  );
}

const two = (i: number) => String(i + 1).padStart(2, "0");

export function Chapters({ counts }: { counts: readonly { label: string; value: string | null }[] }) {
  const W = HOME.who;
  const B = HOME.build;
  const half = Math.ceil(B.offerings.length / 2);
  const offerStops = [B.offerings.slice(0, half), B.offerings.slice(half)];
  const whoStops = [...W.ways.map((w) => w.title), W.numbers].map((t, i) => ({ href: `#who-${i + 1}`, t }));
  const buildStops = offerStops.map((o, k) => ({ href: `#build-${k + 1}`, t: o.map((x) => x.title).join(", ") }));
  const chapters = [
    { name: W.title, id: "who-h", from: 0, stops: whoStops },
    { name: B.title, id: "build-h", from: whoStops.length, stops: buildStops },
  ];
  const n = whoStops.length + buildStops.length;

  return (
    <section className="sect steps chap" id="who" style={{ "--n": n } as React.CSSProperties}>
      <div className="steps-pin">
        <div className="container gv chap-grid">
          <div className="chap-rail">
            {chapters.map((c) => (
              <div className="chap-ch" key={c.id}>
                <h2 className="chap-name" id={c.id} data-cons="text">
                  {c.name}
                </h2>
                <ol className="chap-ticks">
                  {c.stops.map((s, j) => (
                    <li key={s.href}>
                      <a className="steps-i" href={s.href}>
                        <span className="num">{two(c.from + j)}</span>
                        <span className="steps-i-t">{s.t}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <p className="lab steps-count" aria-hidden="true">
              Stop <span className="num steps-no">01</span> / {two(n - 1)}
            </p>
          </div>

          <div className="steps-stops">
            {W.ways.map((w, i) => (
              <article className="steps-stop" id={`who-${i + 1}`} key={w.title} aria-labelledby={`who-${i + 1}-h`}>
                <p className="lab">
                  {W.wayLab} · {two(i)}
                </p>
                <Drawing paths={WAY_ICONS[i]} className="chap-ico" />
                <h3 className="chap-t" id={`who-${i + 1}-h`} tabIndex={-1}>
                  {w.title}.
                </h3>
                <p className="chap-line">{w.body}</p>
                {/* in a div: a stop's draw-in moves its children, and that transform would replace the note's tilt */}
                <div className="chap-note">
                  <p className="hand">{w.note}</p>
                </div>
                <p className="lab chap-next" aria-hidden="true">
                  <i />
                  {HOME.next.step}
                </p>
              </article>
            ))}

            <article className="steps-stop" id={`who-${W.ways.length + 1}`} aria-labelledby="who-n-h">
              <h3 className="lab chap-h" id="who-n-h" tabIndex={-1}>
                {W.numbers}
              </h3>
              <dl className="chap-counts">
                {counts.map((c) => (
                  <div key={c.label}>
                    <dt className="lab">{c.label}</dt>
                    <dd className="num" data-count="">
                      {c.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="lab chap-next" aria-hidden="true">
                <i />
                {HOME.next.build}
              </p>
            </article>

            {offerStops.map((offers, k) => {
              const last = k === offerStops.length - 1;
              return (
                <article className="steps-stop" id={`build-${k + 1}`} key={k} aria-labelledby={`build-${k + 1}-h`}>
                  <h3 className="lab chap-h" id={`build-${k + 1}-h`} tabIndex={-1}>
                    {B.title} · {k + 1} of {offerStops.length}
                  </h3>
                  <ul className="chap-offs">
                    {offers.map((o) => (
                      <li className="chap-off" key={o.title}>
                        <Drawing paths={OFFER_ICONS[o.title] ?? []} />
                        <div>
                          <h4 className="chap-off-t">{o.title}</h4>
                          <p className="chap-off-l">{o.line}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {last && (
                    <div className="chap-note">
                      <p className="hand">{B.ctaNote}</p>
                    </div>
                  )}
                  {last ? (
                    <a className="lab chap-next" href="#contact">
                      <i aria-hidden="true" />
                      {HOME.next.brief}
                    </a>
                  ) : (
                    <p className="lab chap-next" aria-hidden="true">
                      <i />
                      {HOME.next.step}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
      {/* where a scroll comes to rest: one point per stop (CSS: .steps-snap) */}
      {Array.from({ length: n }, (_, i) => (
        <span className="steps-snap" key={i} style={{ "--i": i } as React.CSSProperties} aria-hidden="true" />
      ))}
      <Steps id="who" />
    </section>
  );
}
