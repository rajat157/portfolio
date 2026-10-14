# KIT — shared design kit for "Drafted" and "Cut"

A paste-in kit so both studies share tokens, type, cursor, motion and a verify
script, and differ only in their idea. `kit.css` and `kit.js` have no build
step and no dependencies — copy their contents into a single-file prototype's
`<style>`/`<script>` tags (see `demo.html` for the pattern).

## Paste-in

```html
<head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&family=Martian+Mono:wdth,wght@75..112.5,300..700&display=swap">
  <style>/* paste kit.css here, then your study's CSS */</style>
</head>
<body>
  ...
  <script>/* paste kit.js here (defines window.KIT), then your study's JS */</script>
</body>
```

The Google Fonts link is the only external request either file makes. It was
GET-checked and returns 200.

## kit.css tokens

| Token | Value | Use |
|---|---|---|
| `--lab` | `#E7E9EC` | page ground |
| `--panel` | `#F6F7F8` | cards/panels |
| `--ink` | `#0D0F12` | primary text, marks |
| `--graphite` | `#4F5560` | secondary text (≥4.5:1 on `--lab`) |
| `--hairline` | `#C3C7CE` | borders, registration marks |
| `--orange` | `#FF4D12` | fills and large marks only, never small text |
| `--deep-orange` | `#C93400` | thin marks |
| `--blue` | `#2448FF` | links, focus rings, construction lines |
| `--ease-attack` | `cubic-bezier(.2,0,0,1)` | fast, precise transitions |
| `--ease-weight` | `cubic-bezier(.7,0,.2,1)` | slow, heavy transitions |
| `--fs-display`/`--fs-h1`/`--fs-h2`/`--fs-body`/`--fs-mono` | `clamp(...)` | fluid type scale |

`html`/`body` get an explicit `--lab` background and `color-scheme: light`.

## kit.css classes

- `.t-display`, `.t-h1`, `.t-h2` — condensed Instrument Sans headlines (variable `wdth`/`wght`).
- `.t-body` — normal-width Instrument Sans body copy, `--graphite`.
- `.t-mono` — Martian Mono for readouts/labels/data.
- `.container` / `.grid` — centered max-width wrapper / 12-column grid (`--grid-gap` to override).
- `.kit-registration` — small "+" marks tiled at grid intersections (CSS background, no JS).
- `.kit-grain` — optional fixed full-screen paper-grain overlay, ~4% opacity, static, `pointer-events: none`.
- `.kit-reveal` / `.kit-reveal.is-in` — starts from a small visible offset (not opacity 0), settles via `KIT.reveal`.
- `.tap-target` — 44×44px minimum touch target.
- `:focus-visible` — blue outline. `[hidden]{display:none!important}` included.
- `@media (prefers-reduced-motion: reduce)` zeroes all transition/animation durations globally.
- The drafting cursor (`.kit-cursor*`, `html.kit-cursor-on`) is styled here but driven by `kit.js`.

## kit.js — `window.KIT`

- `KIT.beat` — `500` (ms, 120 BPM), internal tempo grid, never shown on the page.
- `KIT.t(n)` — `n` beats (quarter-note = 1 beat) in ms, e.g. `KIT.t(1/16) === 125`, `KIT.t(1/4) === 500`. Use this for every duration in a study.
- `KIT.clock()` — `performance.now()`. Use this for timing, never the rAF callback argument.
- `KIT.loop(fn, target?)` — runs `fn(dt)` every frame (dt seconds: the raw frame time clamped to [0.001, 0.25]; a non-positive dt counts as 1/60). Wraps `fn` in try/catch, logging `[proto] frame-error: <msg>` once. Pauses/resumes itself via an `IntersectionObserver` on `target` (default `document.body`) — it never reads `document.hidden`. Returns a `stop()` function.
- `KIT.reduced` — live boolean, kept in sync with `(prefers-reduced-motion: reduce)`.
- `KIT.spring(from, to, { stiffness, damping })` — returns `{ value, velocity, target, update(dt) }`. `update` integrates in fixed 1/240 s substeps and snaps to the target if the state ever goes non-finite. Set `.target` and call `.update(dt)` each frame (typically inside `KIT.loop`); set `.value` directly for an instant snap under `KIT.reduced`.
- `KIT.reveal(el, opts?)` — adds `.kit-reveal`, then `.is-in` on first intersection (last `IntersectionObserver` entry wins). Instant under `KIT.reduced`.
- `KIT.debug(line)` — no-op unless `location.hash === '#debug'`; then appends to a fixed mono overlay and mirrors to `console.log('[proto] dbg', line)`. Also wires `window.onerror`/`unhandledrejection` into the overlay when active.
- `KIT.ready()` — logs `[proto] ready` exactly once. Call after your study's first meaningful paint.
- Drafting cursor — self-initializes on load, fine pointers only (`(pointer: fine)`). A 21px 1px-line "+" with a `"x 0412 · y 0187"` mono readout, following the pointer via `KIT.spring`. Hidden over links/inputs/buttons/etc. (native cursor shows there instead). No ring, hit marker, magnetism or shake.

## verify-template.mjs

Shared Playwright harness, reused by each study's own verify script.

```sh
npm install playwright-core   # once, inside this kit/ folder
node verify-template.mjs [path/to/study.html]   # defaults to ./demo.html
```

It launches the installed Chrome headless, wraps the target file in a
host-like preview (viewport meta + a restrictive CSP meta), and runs it in
four contexts (1440×900, 1920×905, mobile 390×844 @3x, and a
`reducedMotion: 'reduce'` context) — each with a host shim that forces every
rAF callback to a constant timestamp and `document.hidden`/`visibilityState`
to report hidden, matching the real constraints `kit.js` is built against.

Each context: waits for `[proto] ready`, collects console errors/warnings and
page errors, checks for horizontal overflow on mobile, and scans visible text
plus `aria-label`/`title`/`alt` (skipping `<code>` content) for a banned
word list (gaming/audio-gear jargon). Screenshots are saved to
`screenshots/<context>.png`. A study's own interaction steps go in the
`studyInteractions(page, contextName)` hook near the top of the file.

Prints one `PASS`/`FAIL`/`WARN` line per check, then `VERIFY OK` (exit 0) or
`VERIFY FAIL` (exit 1).

## demo.html

A minimal page exercising every token and helper above. Verify it with:

```sh
node verify-template.mjs 2>&1 | tee final.log
```
