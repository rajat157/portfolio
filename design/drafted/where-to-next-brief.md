# "Where to next" as a 3D world: design prototype brief

You are building ONE design option (named in your task) as a self-contained interactive HTML prototype. Rajat (the site's owner, a software architect; refer to him as Rajat) will review three options side by side and pick one. The review page frames your file in an iframe at full width, about 900px tall.

## The site and this section
- Live site: https://www.rajatkumarr.com. Before designing, look at it at 1440x900 with Playwright (read-only; abort `**/api/contact**`):
  - the hero: the name cut into shards that drift in depth and line up when you "find the view";
  - "Who I am / What I build": chapters with a rail of ticks and icons drawn on stroke by stroke;
  - the current "Where to next" site map: four boxed nodes;
  - the contact brief.
- Your option replaces "Where to next". Its job is to be the site map, in 3D. Rajat: "it should be a 3d world which the user can interact with and go into, like warp into the page that they clicked to explore."
- The four destinations (copy is final; use it verbatim):
  1. `01 · Projects`: "The work, drawn". "4 case studies, each with its real architecture, and 8 earlier projects." CTA "Open". Goes to `/projects`.
  2. `02 · Blog`: "Notes". "Writing on architecture, building with AI and running large systems." CTA "Open". Goes to `/blog`.
  3. `03 · About`: "The long version". "10+ years of experience, the skills behind it and a résumé." CTA "Open". Goes to `/about`.
  4. `04 · Contact`: "Start a conversation". "Tell me what’s slowing your business down. I usually reply within 24–48 hours." CTA "Write". Goes to `#contact`, the brief further down the same page.
- Section header (keep it): h2 "Where to next"; lab "Site map · 4 destinations"; "You are here · Home" with a 14px orange square; the Caveat note "start anywhere".

## The design language: "Drafted", light only (match it exactly)
- Ground `#E7E9EC` with a faint registration grid: a "+" every 48px in `#C3C7CE`. Panel `#F6F7F8`. Ink `#0D0F12`. Graphite `#4F5560` (secondary text). Hairline `#C3C7CE`. Blue `#2448FF` (lines, links, construction and focus). Orange `#FF4D12`: fills only (the "you are here" square, a done mark), never small text.
- Type, all from Google Fonts:
  - display: Instrument Sans 700, `font-stretch: 75%` (`family=Instrument+Sans:wdth,wght@75..100,400..700`);
  - body: Instrument Sans 400/500;
  - labels: Martian Mono 500, 11px, uppercase, letter-spacing .08em;
  - Rajat's handwritten voice: Caveat 600 (blue or graphite, tilted about -2.5deg);
  - numbers and readouts: Doto 800.
- Lines are drafting lines: 1–1.5px, square caps. Construction marks are blue extension lines, dimension lines with px labels, and registration corners. Icons are 24-unit boxes, 1.5px stroke, square caps, drawn on with stroke-dashoffset.
- Motion: precise, quick-in, eased (`cubic-bezier(.2,0,0,1)`). No bounce or confetti. Calm, confident, engineered.
- **Abstract, not literal.** Rajat rejected props and gimmicks (no guitars, no game UI, no sci-fi chrome). The world should feel like a living technical drawing. Every visual must earn its place and read in a second; the audience skims.
- No dark theme. The page commits to this light look, so set the background and every color explicitly.

## Interaction requirements
- **Look around, in place.** The prototype sits in a page that scrolls, so never hijack the mouse wheel or trackpad scroll (let it scroll the page). Use pointer move (gentle parallax) and drag (orbit or look, within limits). On touch, horizontal drag looks around and vertical drag scrolls the page.
- **Hover or focus** a destination: it responds (lifts, inks, shows construction marks and dimension readouts) and its label shows the number, heading, title and line.
- **Click or Enter** warps: one orchestrated camera move of about 1.0–1.4s that ends with the destination filling the screen. In the prototype, end on an "arrival" view: a full-frame sheet in the site's style with the destination's title block ("Sheet 0N of 04", title, line), an "Open the real page ↗" link to `https://www.rajatkumarr.com<path>`, and "← Back to the map", which plays the reverse move. For Contact, the arrival says it lands on the brief below.
- **Keyboard.** A DOM layer of four real `<button>`s or links (visually integrated: labels anchored to the 3D objects by projecting their positions each frame). Tab moves focus between destinations, focus shows the same state as hover, Enter warps, and Escape goes back.
- `prefers-reduced-motion`: no drift and no flight; warp becomes an instant cut or a 150ms fade.
- No WebGL: show the four destinations as a plain list of links in the same style (a 10-line fallback is enough).
- **Performance.** Hold 60fps at 1440x900 on an integrated GPU: under about 80 draw calls (merge geometry; use LineSegments), devicePixelRatio capped at 2, no heavy post-processing. Render on demand (pause when idle and nothing is animating).
- **Phone (390x844).** It must work and read well: labels legible, tap to select (the label shows a "Go →" button), tap Go (or tap the selected object again) to warp. No horizontal page scroll.

## Tech
- One HTML file, no build step. Load three.js as ES modules from jsdelivr ONLY, with an import map: `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js` (and `/examples/jsm/...` addons if needed). Other hosts are blocked in the review page.
- Fonts from Google Fonts with real fallback stacks. Canvas-texture text must `await document.fonts.load(...)` first. Prefer HTML overlay labels for crisp text.
- Put a `<title>` at the top. The file is the full document (doctype, html, head, body), so write all of it.
- Write ONLY inside your output folder (named in your task). Read the repo for reference if useful: `D:\Projects\portfolio\frontend\src\app\(site)\globals.css` (tokens and components), `frontend\src\components\home\chapters.tsx` (icons), `frontend\src\components\home\stage.tsx` (the shard look). Never modify the repo.

## Verify before you report (once, then fix)
- Serve your folder over HTTP (for example `python -m http.server`, or a small Node static server); file:// may block ES-module CDN imports. Use playwright-core from `file:///D:/Projects/portfolio/frontend/node_modules/playwright-core/index.mjs` with system Chrome (`executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"`, args `--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`).
- Take screenshots into your folder:
  - at rest (1440x900 and 390x844);
  - a destination hovered or focused;
  - mid-warp;
  - the arrival view;
  - after "Back to the map".
- Record: console errors (must be 0), and that Tab, Enter and Escape work.
- Look at your screenshots and fix what is visibly wrong. Don't loop endlessly: one fix pass, then report.

## Report back (under 200 words)
File path; the concept in two sentences; how the interaction and the warp work; screenshot paths (rest, hover, mid-warp, arrival, phone); known limits or open questions for Rajat.
