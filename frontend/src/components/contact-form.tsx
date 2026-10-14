"use client";

// The routed brief (D28, BUILD-PLAN.md §0 item 6; refined for the home/contact
// split). SSR markup is a plain `<form method="post" action="/api/contact">`
// that works with no JS at all. JS enhancement adds: readiness (each row's
// square inks when that part is valid), the send animation (an orange run
// down the route while the POST is in flight, then the sheet shatters and the
// "Received" receipt assembles from its pieces), inline field errors and an
// aria-live status line. Reused by the home close (`#contact`) and later by
// `/contact` (P4).
//
// No-JS (D28 refined): `#sent`/`#send-error`, always rendered, are hidden by
// default and shown via CSS `:target` when the server 303-redirects to
// `<path>#sent`/`<path>#send-error` (globals.css). The JS path shows the same
// two elements by toggling `data-status` on the wrapper directly (imperative,
// not React state, so the DOM reflects it before the shatter/assemble
// animations measure it).

import { useId, useRef, useState } from "react";
import { T } from "@/lib/tempo";
import { tick, thunk } from "@/lib/sound";
import { reducedMotion } from "@/lib/motion";

// subjects/replyHours come from the caller (src/content/home.ts) as props,
// not a direct import of the whole content module -- this is a client
// component, and the rest of HOME (problems, offerings, map nodes, ...)
// would otherwise ship to the browser unused.
interface ContactFormProps {
  subjects: readonly string[];
  replyHours: string;
}

type RowKey = "name" | "email" | "subject" | "message";
type FieldErrors = Partial<Record<RowKey, string>>;
type Ok = Record<"name" | "email" | "need" | "message", boolean>;


type Piece = { c: HTMLElement; dx: number; dy: number; k: number; d: number };

// Flat copies of the sheet, each clipped to one piece and pinned over it
// (fixed to the viewport for the flight). cloneNode(true) mirrors attributes,
// not the live `.value`/`.checked` a person typed, so each clone's own inputs
// are set explicitly here from the original -- writing only onto the clone,
// never the original (the port'd fix: writing into the original's
// defaultValue would make "Start another brief" fail to clear the real form).
function piecesOf(el: HTMLElement): Piece[] {
  const r = el.getBoundingClientRect();
  const cols = 5;
  const rows = 4;
  const out: Piece[] = [];
  const origInputs = Array.from(el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const c = el.cloneNode(true) as HTMLElement;
      c.removeAttribute("id");
      c.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      const cloneInputs = Array.from(c.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));
      cloneInputs.forEach((cEl, k) => {
        const orig = origInputs[k];
        if (!orig) return;
        if (orig instanceof HTMLInputElement && (orig.type === "radio" || orig.type === "checkbox")) {
          (cEl as HTMLInputElement).checked = orig.checked;
        } else {
          cEl.value = orig.value;
        }
      });
      c.hidden = false;
      c.inert = true;
      c.setAttribute("aria-hidden", "true");
      c.style.cssText =
        "position:fixed;z-index:70;margin:0;pointer-events:none;left:" +
        r.left +
        "px;top:" +
        r.top +
        "px;width:" +
        r.width +
        "px;height:" +
        r.height +
        "px;clip-path:inset(" +
        (j * 100) / rows +
        "% " +
        (100 - ((i + 1) * 100) / cols) +
        "% " +
        (100 - ((j + 1) * 100) / rows) +
        "% " +
        (i * 100) / cols +
        "%)";
      out.push({
        c,
        dx: ((i + 0.5) / cols - 0.5) * r.width,
        dy: ((j + 0.5) / rows - 0.5) * r.height,
        k: 0.55 + Math.random() * 0.9,
        d: (i + j) * 26,
      });
    }
  }
  return out;
}

// Flat pieces pushed apart as if along their lines of sight: nearer ones
// (smaller k) travel further.
function flight(s: Pick<Piece, "dx" | "dy" | "k">, sign: number): string {
  const f = 2.2 - s.k;
  return `translate(${Math.round(s.dx * f * 0.9)}px,${Math.round(s.dy * f * 0.9 + sign * 36)}px) scale(${s.k.toFixed(2)})`;
}

function shatter(el: HTMLElement, then: () => void) {
  if (reducedMotion()) {
    then();
    return;
  }
  const ps = piecesOf(el);
  ps.forEach((s) => document.body.appendChild(s.c));
  el.style.visibility = "hidden";
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ps.forEach((s) => {
        s.c.style.transition = `transform ${T(3 / 8)}ms var(--ease-weight) ${s.d}ms, opacity ${T(1 / 8)}ms var(--ease-attack) ${T(1 / 4) + s.d}ms`;
        s.c.style.transform = flight(s, 1);
        s.c.style.opacity = "0";
      });
    })
  );
  setTimeout(
    () => {
      ps.forEach((s) => s.c.remove());
      el.style.visibility = "";
      then();
    },
    T(3 / 8) + 7 * 26 + 60
  );
}

function assemble(el: HTMLElement, then: () => void) {
  if (reducedMotion()) {
    then();
    return;
  }
  const ps = piecesOf(el);
  ps.forEach((s) => {
    s.c.style.transform = flight(s, -1);
    s.c.style.opacity = "0";
    document.body.appendChild(s.c);
  });
  el.style.visibility = "hidden";
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ps.forEach((s) => {
        s.c.style.transition = `transform ${T(1 / 4)}ms var(--ease-attack) ${s.d}ms, opacity ${T(1 / 16)}ms var(--ease-attack) ${s.d}ms`;
        s.c.style.transform = "none";
        s.c.style.opacity = "1";
      });
    })
  );
  // focus only once the sheet is visible again: a hidden element cannot take it
  setTimeout(
    () => {
      ps.forEach((s) => s.c.remove());
      el.style.visibility = "";
      then();
    },
    T(1 / 4) + 7 * 26 + 80
  );
}

const O = (ms: number) => ({ "--o": `${ms}ms` } as React.CSSProperties);

export function ContactForm({ subjects, replyHours }: ContactFormProps) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const wasArmed = useRef(false);

  const [ok, setOk] = useState<Ok>({ name: false, email: false, need: false, message: false });
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"idle" | "sending" | "confirmed">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusMsg, setStatusMsg] = useState("");
  const [sentDate, setSentDate] = useState("—");

  const ready = Object.values(ok).filter(Boolean).length;
  const armed = ready === 4;

  function readiness() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const email = form.elements.namedItem("email") as HTMLInputElement;
    const message = form.elements.namedItem("message") as HTMLTextAreaElement;
    const next: Ok = {
      name: name.value.trim() !== "" && name.validity.valid,
      email: email.value.trim() !== "" && email.validity.valid,
      need: typeof data.get("subject") === "string" && data.get("subject") !== "",
      message: message.value.trim() !== "" && message.validity.valid,
    };
    setOk(next);
    setCount(message.value.length);
    const nowArmed = Object.values(next).filter(Boolean).length === 4;
    if (nowArmed && !wasArmed.current) tick();
    wasArmed.current = nowArmed;
  }

  // "idle", not removed: any data-status switches off the no-JS :target views (globals.css)
  function resetSentView() {
    if (wrapRef.current) wrapRef.current.dataset.status = "idle";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    if (data.get("website")) return; // the hidden field only bots fill in

    const reduced = reducedMotion();
    const rows = Array.from(form.querySelectorAll<HTMLElement>(".brief-row, .brief-send"));
    rows.forEach((n) => (n.inert = true));
    setFieldErrors({});
    setStatusMsg("Sending…");
    setPhase("sending");

    let res: Response;
    try {
      const [r] = await Promise.all([
        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.get("name"),
            email: data.get("email"),
            subject: data.get("subject"),
            message: data.get("message"),
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, reduced ? 0 : T(1 / 4) + 60)),
      ]);
      res = r;
    } catch (err) {
      rows.forEach((n) => (n.inert = false));
      setPhase("idle");
      setStatusMsg(`Not sent: ${err instanceof Error ? err.message : "network error"}. Please try again.`);
      return;
    }

    let json: { success?: boolean; error?: string; details?: Record<string, string[]> } = {};
    try {
      json = await res.json();
    } catch {
      /* non-JSON body: fall through to the generic error below */
    }

    if (res.ok && json.success) {
      setSentDate(new Date().toISOString().slice(0, 10));
      setPhase("confirmed");
      setStatusMsg("Sent.");
      thunk();
      setTimeout(
        () => {
          const then = () => {
            if (wrapRef.current) wrapRef.current.dataset.status = "sent";
            if (sentRef.current) {
              assemble(sentRef.current, () => sentRef.current?.focus({ preventScroll: true }));
            }
          };
          if (formRef.current) shatter(formRef.current, then);
          else then();
        },
        reduced ? 0 : T(1 / 8) + 150
      );
      return;
    }

    rows.forEach((n) => (n.inert = false));
    setPhase("idle");
    if (res.status === 400 && json.details) {
      const details = json.details;
      setFieldErrors({
        name: details.name?.[0],
        email: details.email?.[0],
        subject: details.subject?.[0],
        message: details.message?.[0],
      });
      const reason = Object.values(details).flat()[0] ?? "please check the form";
      setStatusMsg(`Not sent: ${reason}. Please try again.`);
    } else {
      // the server's error copy already ends with what to do next
      setStatusMsg(json.error ? `Not sent: ${json.error}` : "Not sent: something went wrong. Please try again.");
    }
  }

  function startAnother() {
    const done = sentRef.current;
    const form = formRef.current;
    if (!done || !form) return;
    shatter(done, () => {
      resetSentView();
      form.reset();
      setPhase("idle");
      setFieldErrors({});
      setStatusMsg("");
      setSentDate("—");
      Array.from(form.querySelectorAll<HTMLElement>(".brief-row, .brief-send")).forEach((n) => (n.inert = false));
      readiness();
      assemble(form, () => (form.elements.namedItem("name") as HTMLInputElement | null)?.focus({ preventScroll: true }));
    });
  }

  const briefClass = ["brief", armed && phase === "idle" ? "armed" : "", phase === "sending" ? "sending" : "", phase === "confirmed" ? "sent" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="brief-wrap" ref={wrapRef} data-cons="box">
      <div className="brief brief-done" id="sent" ref={sentRef} tabIndex={-1}>
        <div className="brief-top">
          <p className="brief-cell done">
            <span className="lab">Received</span>
            <span className="num">01</span>
          </p>
          <p className="lab">To · Rajat</p>
          <p className="lab">
            <span className="num">{sentDate}</span>
          </p>
        </div>
        <p className="done-t">Thanks. Your brief is on the drawing board.</p>
        <p className="who-body done-b">I usually reply within {replyHours} hours.</p>
        <button className="btn needs-js" type="button" onClick={startAnother}>
          Start another brief
        </button>
        <a className="btn no-js-only" href="#contact">
          Start another brief
        </a>
      </div>

      <div className="brief" id="send-error">
        <p className="done-t">Your brief did not go through.</p>
        <p className="who-body done-b">Please go back and try sending it again.</p>
      </div>

      <form className={briefClass} id="cform" ref={formRef} method="post" action="/api/contact" aria-label="Send Rajat a brief" onSubmit={handleSubmit} onInput={readiness} onChange={readiness}>
        <div className="brief-top">
          <p className="brief-cell">
            <span className="lab">Brief</span>
            <span className="num">01</span>
          </p>
          <p className="lab">To · Rajat</p>
          <p className="lab">
            Ready <span className="num">{ready}/4</span>
          </p>
        </div>

        <div className={ok.name ? "brief-row done" : "brief-row"} data-f="name">
          <b className="sq" style={O(0)} aria-hidden="true" />
          <i className="w w-out" style={O(0)} aria-hidden="true" />
          <label className="lab" htmlFor={`${uid}-name`}>
            <span className="num">01</span> · From
          </label>
          <input
            className="bin"
            id={`${uid}-name`}
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
            minLength={2}
            maxLength={100}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? `${uid}-name-err` : undefined}
          />
          {fieldErrors.name && (
            <p className="err" id={`${uid}-name-err`}>
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className={ok.email ? "brief-row done" : "brief-row"} data-f="email">
          <i className="w w-in" style={O(60)} aria-hidden="true" />
          <b className="sq" style={O(110)} aria-hidden="true" />
          <i className="w w-out" style={O(120)} aria-hidden="true" />
          <label className="lab" htmlFor={`${uid}-email`}>
            <span className="num">02</span> · Reply to
          </label>
          <input
            className="bin"
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            maxLength={200}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? `${uid}-email-err` : undefined}
          />
          {fieldErrors.email && (
            <p className="err" id={`${uid}-email-err`}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div
          className={ok.need ? "brief-row done" : "brief-row"}
          data-f="need"
          role="radiogroup"
          aria-labelledby={`${uid}-need-l`}
          aria-invalid={fieldErrors.subject ? true : undefined}
          aria-describedby={fieldErrors.subject ? `${uid}-need-err` : undefined}
        >
          <i className="w w-in" style={O(180)} aria-hidden="true" />
          <b className="sq" style={O(230)} aria-hidden="true" />
          <i className="w w-out" style={O(240)} aria-hidden="true" />
          <p className="lab" id={`${uid}-need-l`}>
            <span className="num">03</span> · Need
          </p>
          <div className="chips">
            {subjects.map((s, i) => (
              <label key={s} className={i === subjects.length - 1 ? "chip chip-wide" : "chip"}>
                <input type="radio" name="subject" value={s} required={i === 0} />
                <span>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </span>
              </label>
            ))}
          </div>
          {fieldErrors.subject && (
            <p className="err" id={`${uid}-need-err`}>
              {fieldErrors.subject}
            </p>
          )}
        </div>

        <div className={ok.message ? "brief-row done" : "brief-row"} data-f="message">
          <i className="w w-in" style={O(300)} aria-hidden="true" />
          <b className="sq" style={O(350)} aria-hidden="true" />
          <i className="w w-out" style={O(360)} aria-hidden="true" />
          <label className="lab" htmlFor={`${uid}-msg`}>
            <span className="num">04</span> · Brief
          </label>
          <textarea
            className="bin ruled"
            id={`${uid}-msg`}
            name="message"
            rows={3}
            placeholder="What’s slowing you down? A few lines is enough."
            required
            minLength={10}
            maxLength={5000}
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby={fieldErrors.message ? `${uid}-msg-err` : undefined}
          />
          <p className="lab count">
            <span className="num">{count}</span> / 5000
          </p>
          {fieldErrors.message && (
            <p className="err" id={`${uid}-msg-err`}>
              {fieldErrors.message}
            </p>
          )}
        </div>

        <button className="brief-send" type="submit">
          <i className="w w-in" style={O(420)} aria-hidden="true" />
          <span className="here" aria-hidden="true" />
          <span className="send-to">Rajat</span>
          <span className="lab send-act">
            <span className="send-go">Send the brief →</span>
            <span className="send-got">
              Received · <span className="num">{sentDate}</span>
            </span>
          </span>
        </button>

        {/* "website", not "company": no autofill profile has a website field to fill it with */}
        <div className="hp" aria-hidden="true">
          <label htmlFor={`${uid}-website`}>Leave this empty</label>
          <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </form>

      <p className="lab" data-contact-status aria-live="polite">
        {statusMsg}
      </p>
    </div>
  );
}
