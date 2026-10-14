// "What's slowing you down?" (round 2, the canvas board "Sections B"): the stage's six problems as an index, each
// opening a stop with its fix, what I'd build, where I did it and a brief with that need ticked; a seventh stop holds
// the offerings no problem leads to. Server-rendered as the index over seven stacked stops, which is the whole
// section with no JS or under reduced motion; PickScroll pins it and steps through the stops as you scroll.
import Link from "next/link";
import { HOME } from "@/content/home";
import { Steps } from "@/components/home/steps";

// one drafting-stroke icon per offering (24-unit boxes, like the stage's), drawn on as its stop opens
const OFFER_ICONS: Record<string, string> = {
  "Portals and platforms": "M3 20h18 M5 20V9h4v11 M10 20V6h4v14 M15 20V9h4v11",
  "Internal tools": "M4 5h16v14H4z M4 10h16 M10 10v9 M13 15l2 2 3-4",
  "Real-time data": "M3 19h18 M3 15l4-5 4 3 3-6 3 4h4",
  "Sites you run yourself": "M3 5h18v14H3z M3 9h18 M9 17l6-6 2 2-6 6H9z",
  "AI where it helps": "M7 5H5v14h2 M17 5h2v14h-2 M12 7l1.3 3.7L17 12l-3.7 1.3L12 17l-1.3-3.7L7 12l3.7-1.3z",
  "A second look": "M3 3h8v8H3z M10 14a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M17 17l4 4",
};

function Offer({ title }: { title: string }) {
  const offer = HOME.build.offerings.find((o) => o.title === title);
  return (
    <div className="pick-build">
      <svg className="steps-ico pick-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
        <path pathLength={1} d={OFFER_ICONS[title] ?? ""} />
      </svg>
      <div>
        <p className="pick-offer">{title}</p>
        {offer && <p className="pick-line">{offer.line}</p>}
      </div>
    </div>
  );
}

const two = (i: number) => String(i + 1).padStart(2, "0");

export function Pick() {
  const P = HOME.pick;
  const stops = [...HOME.problems.map((p) => p.problem), P.more.chip];

  return (
    <section className="sect steps pick" id="build" aria-labelledby="pick-h" style={{ "--n": stops.length } as React.CSSProperties}>
      <div className="steps-pin">
        <div className="container gv steps-grid">
          <div className="steps-side">
            <p className="lab">{P.lab}</p>
            <h2 id="pick-h" className="t-h2" data-cons="text">
              {P.title}
            </h2>
            <ol className="steps-list">
              {stops.map((s, i) => (
                <li key={s}>
                  <a className="steps-i" href={`#pick-${i + 1}`}>
                    <span className="num">{two(i)}</span>
                    <span className="steps-i-t">{s}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="hand steps-note">{P.note}</p>
            <p className="lab steps-count" aria-hidden="true">
              <span className="num steps-no">01</span> / {two(stops.length - 1)}
            </p>
          </div>

          <div className="steps-stops">
            {HOME.problems.map((p, i) => (
              <article className="steps-stop" id={`pick-${i + 1}`} key={p.problem} aria-labelledby={`pick-${i + 1}-h`}>
                <div>
                  <p className="lab">{P.fixLab}</p>
                  <p className="pick-prob">
                    <s>{p.problem}</s>
                  </p>
                  <h3 className="pick-fix" id={`pick-${i + 1}-h`} tabIndex={-1}>
                    {p.fix}.
                  </h3>
                </div>
                <div>
                  <p className="lab">{P.buildLab}</p>
                  <Offer title={p.offer} />
                </div>
                <div className="pick-work">
                  <p className="lab">
                    {P.workLab} · {p.work}
                  </p>
                  <p className="pick-proof">{p.proof}</p>
                  <Link className="lab pick-sheet" href={p.href}>
                    {P.sheet} →
                  </Link>
                </div>
                <div className="pick-cta">
                  <a className="btn btn-ink" href="#contact" data-need={p.need}>
                    {P.cta}
                  </a>
                  <span className="pick-need needs-js">
                    <i aria-hidden="true" />
                    {p.need}
                  </span>
                  <span className="lab needs-js">{P.ticked}</span>
                </div>
              </article>
            ))}
            <article className="steps-stop pick-more-stop" id={`pick-${stops.length}`} aria-labelledby={`pick-${stops.length}-h`}>
              <div>
                <p className="lab">{P.more.lab}</p>
                <h3 className="pick-fix" id={`pick-${stops.length}-h`} tabIndex={-1}>
                  {P.more.title}
                </h3>
              </div>
              <div className="pick-more">
                {P.more.offers.map((o) => (
                  <Offer key={o} title={o} />
                ))}
              </div>
              <div className="pick-cta">
                <a className="btn btn-ink" href="#contact">
                  {P.more.cta}
                </a>
                <p className="hand">{HOME.build.ctaNote}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
      <Steps id="build" />
    </section>
  );
}
