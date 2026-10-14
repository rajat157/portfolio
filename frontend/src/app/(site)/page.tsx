// The home experience (BUILD-PLAN.md §0, "P3b — Home experience"): the
// shard-cut name stage, the scroll story, "Who I am" / "What I build" /
// "Where to next" and the close contact brief. Server-rendered (this file)
// plus two client islands: Stage (three.js, lazy) and ContactForm
// (progressive enhancement; posts natively without JS). Everything here is
// readable with no JS, no WebGL and reduced motion.
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { NameMark } from "@/components/home/name-mark";
import { Stage } from "@/components/home/stage";
import { PenBlocks } from "@/components/reveal";
import { HOME, mapProjectsDesc } from "@/content/home";
import { cmsProjects } from "@/lib/cms";
import { FALLBACK_EARLIER, FALLBACK_SHEETS } from "@/lib/cms/fallback";
import type { Project } from "@/lib/cms/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Rajat",
  description: HOME.lead,
};

async function getCounts(): Promise<{ featured: number; earlier: number }> {
  let projects: Project[] = [];
  try {
    projects = await cmsProjects();
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }
  if (projects.length === 0) {
    return { featured: FALLBACK_SHEETS.length, earlier: FALLBACK_EARLIER.length };
  }
  // /projects' rule, so the counts match what it shows as sheets and earlier works
  const featured = projects.filter((p) => p.featured && p.sheet && p.drawing).length;
  return { featured, earlier: projects.length - featured };
}

// The lines the hero callout cycles through in its breathers (real copy from HOME), and each step caption's key phrase.
const LEADS = [HOME.lead, HOME.who.ways[0].body, HOME.who.ways[1].body];
const KEYS = ["don’t talk", "understand them", "feel right"];

// A step caption as words, so it can arrive word by word, with its key phrase marked to be underlined.
function CapTitle({ text, mark }: { text: string; mark: string }) {
  const from = text.indexOf(mark);
  const to = from + mark.length;
  const words = text.split(" ");
  const starts = words.map((_, i) => (i ? words.slice(0, i).join(" ").length + 1 : 0));
  return (
    <span className="cap-t">
      {words.map((w, i) => {
        const key = from >= 0 && starts[i] >= from && starts[i] < to;
        return (
          <span key={i}>
            <span className={key ? "cw cw-key" : "cw"} style={{ "--i": i } as React.CSSProperties}>
              {w}
            </span>{" "}
          </span>
        );
      })}
    </span>
  );
}

export default async function HomePage() {
  const counts = await getCounts();
  const whoCounts = HOME.who.counts.map((c) => (c.value === null ? { ...c, value: String(counts.featured) } : c));

  return (
    <>
      <div className="exp" id="exp" data-step="0">
        <div
          className="exp-pin kit-registration"
          tabIndex={0}
          role="group"
          aria-roledescription="interactive drawing"
          aria-label="Rajat, cut into pieces at different depths. Use the arrow keys to turn the view until the pieces line up, or press Enter to line them up."
        >
          {/* Stage (client) creates the <canvas> itself, only once WebGL is
              confirmed available -- so no-JS, reduced-motion and no-WebGL
              contexts never have one in the DOM at all. */}
          <div className="fallback-name" aria-hidden="true">
            <NameMark />
          </div>
          <div className="lockx" aria-hidden="true" />
          <div className="exp-ui">
            <div className="container">
              <div className="meta">
                <p className="lab">Software architect &amp; developer</p>
                <p className="lab">Bangalore, India · 10+ years</p>
              </div>
              <div className="mid" aria-hidden="true" />
              <div className="exp-foot">
                <div className="stack">
                  <div className="hook-copy">
                    <h1 className="sr-only">Rajat, software architect and developer</h1>
                    <p className="hand hook-note" aria-hidden="true">
                      {HOME.hookNote}
                    </p>
                    <p className="lead">{HOME.lead}</p>
                    <div className="proc-static">
                      <p className="process">{HOME.processStatic}</p>
                    </div>
                    <p className="hint lab" hidden>
                      <span className="fine">{HOME.hint.fine}</span>
                      <span className="coarse">{HOME.hint.coarse}</span>
                    </p>
                    <button className="btn" id="alignBtn" type="button" hidden>
                      {HOME.alignLabel}
                    </button>
                    <p className="cue lab">{HOME.cue}</p>
                  </div>
                  <ol className="caps stack" aria-label="How I help">
                    <li className="cap" data-step="1">
                      <span className="lab">
                        <span className="num">{HOME.steps[0].num}</span> · {HOME.steps[0].lab}
                      </span>
                      <CapTitle text={HOME.steps[0].title} mark={KEYS[0]} />
                      <span className="sr-only">{HOME.problems.map((p) => p.problem).join(". ")}.</span>
                    </li>
                    <li className="cap" data-step="2">
                      <span className="lab">
                        <span className="num">{HOME.steps[1].num}</span> · {HOME.steps[1].lab}
                      </span>
                      <CapTitle text={HOME.steps[1].title} mark={KEYS[1]} />
                      <span className="hand cap-note">{HOME.stepNote}</span>
                    </li>
                    <li className="cap" data-step="3">
                      <span className="lab">
                        <span className="num">{HOME.steps[2].num}</span> · {HOME.steps[2].lab}
                      </span>
                      <CapTitle text={HOME.steps[2].title} mark={KEYS[2]} />
                      <span className="cap-s">{HOME.subLine}</span>
                      <span className="sr-only">{HOME.problems.map((p) => p.fix).join(". ")}.</span>
                    </li>
                  </ol>
                </div>
                <div className="hud" aria-hidden="true" hidden>
                  <p className="lab" id="hudRow1">
                    Turn +00.0° · Tilt +00.0°
                  </p>
                  <p className="lab" id="hudRow2">
                    Off 00.0°
                  </p>
                  <div className="meter">
                    <i id="hudBar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="sr-only" id="hookLive" aria-live="polite" />
        </div>
      </div>
      <Stage problems={HOME.problems} leads={LEADS} />

      <section className="sect" id="who" aria-labelledby="who-h">
        <div className="container gv">
          <div className="sec-head">
            <h2 id="who-h" className="t-h2" data-cons="text">
              Who I am
            </h2>
          </div>
          <div className="who-v">
            <p className="who-body who-intro">{HOME.who.intro}</p>
            <ol className="ways">
              {HOME.who.ways.map((w, i) => (
                <li key={w.title} data-cons="box">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="way-t">{w.title}</h3>
                    <p className="who-body">{w.body}</p>
                  </div>
                  <p className="hand">{w.note}</p>
                </li>
              ))}
            </ol>
            <dl className="counts counts-row">
              {whoCounts.map((c) => (
                <div key={c.label}>
                  <dt className="lab">{c.label}</dt>
                  <dd className="num">{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="sect" id="build" aria-labelledby="build-h">
        <div className="container gv">
          <div className="sec-head">
            <h2 id="build-h" className="t-h2" data-cons="text">
              What I build
            </h2>
            <p className="lab">{HOME.build.sub}</p>
          </div>
          <div className="blocks offer">
            {HOME.build.offerings.map((o, i) => (
              <PenBlocks key={o.title}>
                <h3 className="blk-h">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span> · {o.title}
                </h3>
                <p className="ln">{o.line}</p>
              </PenBlocks>
            ))}
          </div>
          <div className="cta-row">
            <a className="btn btn-ink" href="#contact">
              Tell me about your business
            </a>
            <Link className="btn" href="/projects">
              See the projects
            </Link>
            <p className="hand">{HOME.build.ctaNote}</p>
          </div>
        </div>
      </section>

      <section className="sect" id="map" aria-labelledby="map-h">
        <div className="container gv">
          <div className="sec-head">
            <h2 id="map-h" className="t-h2" data-cons="text">
              Where to next
            </h2>
            <p className="lab">{HOME.map.sub}</p>
          </div>
          <div className="map-root">
            <span className="here" aria-hidden="true" />
            <span className="lab">You are here · Home</span>
            <span className="hand">{HOME.map.rootNote}</span>
          </div>
          <ul className="map-nodes">
            {HOME.map.nodes.map((node) => {
              const desc = node.desc ?? mapProjectsDesc(counts.featured, counts.earlier);
              return (
                <li key={node.heading}>
                  <Link className="node" href={node.href} data-cons="box">
                    <span className="lab">
                      <span className="num">{node.num}</span> · {node.heading}
                    </span>
                    <span className="node-t">{node.title}</span>
                    <span className="node-d">{desc}</span>
                    <span className="node-go lab">
                      {node.cta}
                      <span aria-hidden="true">{node.cta === "Write" ? " ↓" : " →"}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="foot end" id="contact">
        <div className="container">
          <div className="end-grid">
            <div className="end-copy">
              <p className="end-t" data-cons="text">
                {HOME.close.title}
              </p>
              <p className="hand end-note">{HOME.close.note}</p>
              <p className="lab end-reply">
                I usually reply within <span className="num">{HOME.close.replyHours}</span> hours
              </p>
            </div>
            <ContactForm subjects={HOME.subjects} replyHours={HOME.close.replyHours} />
          </div>
        </div>
      </section>
    </>
  );
}
