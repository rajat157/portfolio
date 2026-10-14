# Drafted — handoff

**Status:** DRAFTED was CHOSEN by Rajat on 2026-10-13 as the portfolio redesign direction.

**Live prototype (source of truth):** https://claude.ai/artifact/TGAYW2UuP8PMSqnpXNb2vG
Read it with the Artifact tool (`action: read`) before building from it — this folder is a
snapshot taken at the point of decision, the artifact may have since diverged.

## Files

- `drafted.html` — the full single-file prototype (markup + KIT CSS/JS inlined).
- `verify.mjs` — Playwright-based structural/visual verification script used while drafting.
- `content.json` / `content.md` — the verified project content (facts, stack, problem/built/
  decisions/outcome copy) that the sheets are built from. `content.md` is the human-readable form.
- `kit/kit.js`, `kit/kit.css`, `kit/README.md` — the shared "KIT" design kit (tokens, type scale,
  easing, drafting-cursor, grain overlay, reveal/spring helpers) that both the "Drafted" and the
  rejected "Cut" study were built on top of.

## How the study works

- **Hero**: the name is constructed as an SVG letterform, drawn stroke-by-stroke ("constructed"),
  then "inked" solid — a drafting/blueprint metaphor for how the work gets built.
- **Hover reveal**: hovering any part of the page reveals its construction lines (guides, real
  pixel measurements) in blue, laid over a faint 12-column grid.
- **"Show construction" toggle**: a persistent header button that pins construction mode on
  instead of requiring hover (`data-construction="on"` on `<html>`), for touch devices and anyone
  who wants to keep inspecting.
- **Works index**: a table of the four real projects (Offpriced, the staffing operations
  platform, lucif3r, Tredye). Each row's hover/selection drives a sticky side panel that drafts
  that project's *real* architecture diagram (SVG), not a generic icon — boxes for systems,
  arrows for data/request flow, hatching for walled-off data (e.g. row-level security).
- **Inspect sheets**: opening a project moves a full "sheet" into a focused, dialog-like fixed
  view (`#inspect`) with a title block (sheet no. / project / for / kind / stack), the architecture
  figure, and four blocks of copy — **Problem / What I built / Key decisions / Outcome** — each
  pulled straight from `content.json`.
- **Static-HTML fallback**: the sheets exist in the normal document flow too (`.sheets`/`.psheet`),
  fully readable without JS; JS progressively enhances by moving the active one into `#inspect`
  and hiding the always-present `.dia-text` plain-text description of each diagram (kept for
  no-JS/no-canvas readers; `html:not(.js) .fig-box { display: none }`).
- **KIT tempo/loop/springs**: `KIT.beat`/`KIT.t()` define an internal (never displayed) musical
  tempo grid used only to time animation durations consistently. `KIT.loop` runs a single shared
  `requestAnimationFrame` loop keyed to `performance.now()`, clamping/normalizing `dt`, pausing via
  `IntersectionObserver` when off-screen. `KIT.spring` is a tiny critically-damped spring
  integrator stepped in fixed `1/240s` substeps inside that `dt` (stable under slow frames up to
  the loop's 0.25s clamp), used for any physical/eased motion rather than CSS transitions alone.

## Open items for the real build

- Safari/WebKit letter metrics for the constructed-SVG hero are untested.
- The grain overlay's `mix-blend-mode: multiply` cost on low-end phones is unmeasured.
- The drafting cursor hides the OS cursor (`cursor: none` under `pointer: fine`) — make this
  opt-in, or just keep the system cursor, rather than defaulting to hiding it.
- No tablet test context was run (phone and desktop only).
- The banned-word scan (used while drafting to keep language abstract) exempts `[data-fact]`
  project text — real project facts (names, stacks, companies) are allowed to say what they are;
  only the surrounding UI language is held to the abstraction rule.

## Rules carried forward

- Express Rajat's character **abstractly** through UI/UX — never literal music, guitar, or game
  props.
- Projects are explained plainly (the four sheets' Problem/Built/Decisions/Outcome copy).
- Loadout UI language only (no other metaphor system).
- Naming rules: the staffing client stays anonymous; lucif3r is named by handle only, never the
  talent's full name; Offpriced may be named; Tredye is framed as market *monitoring*, never
  trading *signals*.
- First name only: "Rajat" everywhere, never the full name or "RKR".

## Home page (2026-10-13)

After three prototype rounds, Rajat chose **Shards** for the home page.
- Live: https://claude.ai/artifact/BFLp37eWszswfUk9fgSiX1
- Snapshot: `home-prototype.html`. Its name-style switcher was for comparison only.

The home is an experience about him, not his projects:
- He is found by lining up the shards of "Rajat." (three.js).
- A scroll story shows how he helps a business: parts → take apart → one system.
- Then Who I am, What I build, a site map and a contact close.
- Caveat handwritten notes are his voice.

BUILD-PLAN.md §0 has the spec.
