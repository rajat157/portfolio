# Drafted — build plan (port of the prototype into `frontend/`)

Written 2026-10-13 by the specialist (planning only; nothing in `frontend/` was changed).
Prototype = `design/drafted/drafted.html` (identical to the live artifact apart from the host
wrapper: `diff` of live lines 2-2004 vs snapshot = only the trailing `</body></html>`).
All prototype references below are `drafted.html:<line>`.

**Builder environment (every phase, PowerShell):**
```powershell
$env:Path = "C:\Users\rajat\.nvm\versions\node\v24.13.0\bin;" + $env:Path   # Node 24; default node is v25
Set-Location D:\Projects\portfolio\frontend
podman start portfolio-payload-pg                                             # dev DB, port 5434
$env:DATABASE_URI = "postgresql://payload:payload@localhost:5434/payload"     # pre-set: always wins over .env files
$env:NODE_OPTIONS = "--network-family-autoselection-attempt-timeout=3000"     # podman answers on ::1 only; under build load the
                                                                              # default 250 ms per-address try times out -> pages fall back
```
- **Worktrees (P3b and P4 run in parallel):** each worktree's `frontend/.env.local` is a copy of the main one with
  `RESEND_API_KEY` blanked, so `/api/contact` only logs and never emails Rajat. `frontend/media` is a junction to the main
  tree's `media/`. There is no `.env.production.local`. Ports: main 3000, P3b 3001, P4 3002, with
  `VERIFY_BASE_URL=http://localhost:<port>`. In the main tree `next start` loads the LIVE Resend key, so every harness
  check of the contact form intercepts `/api/contact` with `page.route`.
- Payload CLI: `node_modules\.bin\payload.cmd ...` (npx.ps1 drops a bare `--`). TS scripts: `node_modules\.bin\tsx.cmd`.
- **`frontend/.env.production.local` exists and holds PRODUCTION secrets** (DATABASE_URL, DATABASE_URL_UNPOOLED,
  BLOB_READ_WRITE_TOKEN, RESEND_API_KEY …). `next build` / `next start` load it. The DB stays local only because
  `DATABASE_URI` beats `DATABASE_URL` in `payload.config.ts:23`, but the **prod Blob token is live in local prod
  builds**: never open `/admin` or upload anything under `next start`. Do not edit or print that file.
- Never push, never connect to production, never run `npm run ci` (POSIX syntax; it migrates whatever DB it sees).

---

## 0. Revision 2026-10-13: the home page is an experience about Rajat (read first; supersedes parts below)

Rajat reviewed three home prototypes and chose the **Shards** version:
- Live: https://claude.ai/artifact/BFLp37eWszswfUk9fgSiX1
- Snapshot: `design/drafted/home-prototype.html`

The prototype's name-style switcher was there to compare options only. Build Shards only.

**What the home is (top to bottom; no project or post content on the home)**
1. **Stage (pinned, three.js).** "Rajat." is set in Instrument Sans (wdth 75, wght 650) with the orange-square full stop.
   - **Pieces:** the name is cut into about 35 rectangular shards (9 jittered columns, 3–5 rows each, empty pieces dropped). Each shard sits on its own line of sight from one station point, so the name reads only from that point.
   - **Input:** moving a fine pointer across the stage turns the view; touch uses a sideways drag (`touch-action: pan-y`); arrow keys turn it, and Enter or the "Line it up" button aligns it.
   - **Lock:** there is a gentle pull near the view. Below 1.6° it snaps, the shards ink blue → black from left to right, a crosshair flashes, and the Caveat note "you found the view" appears.
   - **HUD:** "Turn / Tilt / Off" plus a meter.
   - **Load:** the page loads with the name whole (server-rendered SVG). When the stage is ready it takes over aligned, then breaks into the scattered state.
2. **The scroll story on the same stage** (scrubbed, smoothed; v6). **One shard language throughout:**
   - **The name exits the Shards way:** flat pieces pushed apart along their lines of sight, turning blue with their cut outlines. No tumbling or rotation.
   - **01 · The parts:** "Most businesses run on parts that don't talk to each other." Six problem cards, each drawn to a canvas texture (problem on the front, fix on the back) and cut into 6 shards (3×2, jittered), arrive as a scattered cloud of card fragments in depth.
   - **02 · Take apart:** "I take them apart until I understand them." The camera finds the parts' station point, the shards line up into readable cards, they settle, and dashed links appear. Note: "every system has a view where it makes sense".
   - **03 · Compose:** "Then I put them back together until they feel right." Every shard turns over in place (back face = its piece of the fix), card by card, and an ink frame labelled "One system" closes around them. Sub-line: "One system your team can run, and keep changing."
3. **Who I am: "How I work"** (Rajat's pick, v5). Recent work only, with no early-career projects (no supercomputer, no 33,000 cores).
   - Intro line: "I'm Rajat, an independent software architect and developer. This is how I work."
   - Three numbered ways of working (Doto 01–03, a display title, a body line, a Caveat note):
     - "Understand the work first"
     - "Build the whole thing"
     - "Leave it runnable"
   - A row of Doto counters: 10+ years (he graduated in 2016; corrected from 8+ on 2026-10-14) · 4 platforms shipped since 2025 · largest team led 6 · 24–48 h to a first reply.
4. **What I build:** six offerings as ruled blocks, then "Tell me about your business" and "See the projects". Note: "not sure which one you need? ask me".
5. **Where to next:** a site map. "You are here · Home" leads to Projects, Blog, About and Contact; hover inks the connector. Note: "start anywhere".
6. **Close:** "Tell me what's slowing your business down.", a note and "I usually reply within 24–48 hours", next to the
   **routed brief** (`ContactForm`, D28). Rajat picked it on 2026-10-13 (v9) after comparing it with the v6 brief and a
   drawn route: it is the brief sheet with a route drawn down its left margin.
   - **Layout (v10, after "the form is too tall next to the copy"):** the copy takes 4 columns and the sheet 8. Side by
     side, the copy column stretches to the sheet's height and "I usually reply within 24–48 hours" sits on the send row's
     line. Rows are 8 px top and bottom (inputs keep 44 px targets). The sheet is about 520 px tall at 1280 px wide.
   - **Top row:** an orange "Brief 01" cell, "To · Rajat" and a Doto "Ready n/4" counter.
   - **Four rows, numbered 01–04 along the route:**
     - From (name);
     - Reply to (email);
     - Need: seven numbered radio chips (the six offerings plus "Something else"), sent as `subject`. They fill
       `repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr))`: 3 across on a wide sheet, 2 on a tablet, 1 on a phone;
     - Brief: a ruled textarea, sent as `message`. It starts at 3 lines and grows as you type (`field-sizing: content`, up
       to 10 lines; elsewhere it resizes by hand). Its Doto character count sits under the "04 · Brief" label, or under the
       box on a phone.
   - A honeypot field `company`.
   - **The route:** each row has a 9 px square on a wire down the margin, with a short leader to its label.
     - The square starts as dashed construction (`--blue` at 50%) and inks when its part is valid.
     - The wire to the next square then draws on, and the done row lightens to `--panel`.
     - The row you are in draws a blue pen line under itself and turns its square's outline blue.
   - **Send:** Rajat's row at the foot ("■ Rajat · Send the brief →") is the submit button, with the wire's arrow ending on its
     orange square. It turns orange at 4/4. There is no meter: the route shows the progress.
   - **On send (JS only; reduced motion skips the motion):** orange runs down the route, square by square, while the POST is
     in flight. On a 2xx, Rajat's row turns to ink with "Received · <date>", then the sheet shatters into flat pieces and the
     "Received" receipt assembles from them. On an error the run stops, Rajat's row stays orange and the status line explains
     (D28). Without JS the native POST and the `303` round trip show the same receipt from the server.
   - **Port two prototype fixes:**
     - the shard copies must not write typed values into the form's default values, or "Start another brief" will not clear
       the form;
     - focus moves to the receipt only after it has assembled, because a hidden element cannot take focus.

   The footer below it is "Elsewhere": GitHub, LinkedIn and Bangalore, India. **No email.**

**New decisions**

| # | Decision | Why | Rejected |
|---|---|---|---|
| D19 | The home is the experience above. Projects live on `/projects` (the index of works and the sheets, unchanged) | Rajat's direction after three prototype rounds | Drafted's works-index home |
| D20 | three.js for the home stage only: `three` + `CSS2DRenderer`, loaded by dynamic `import()` inside an effect after first paint. Never loaded under reduced motion or without WebGL | Real perspective and depth for about 35 pieces plus cards is the interaction itself. The static page stands alone | CSS 3D transforms (no shared camera, no lines of sight) |
| D21 | The name's source is an outlined "Rajat." SVG, generated once by `scripts/font-metrics.py` into `src/lib/name-outline.ts`. It is inlined as the SSR/no-JS/LCP mark and rasterized into the shard texture at runtime | Identical letterforms in every engine (the Safari letter-metrics item closes at the source), no font-load race, and LCP is inline SVG. Supersedes D8 and the per-letter construction overlay | Canvas `fillText` with the web font (what the prototype does) |
| D22 | Home copy lives in `src/content/home.ts` (typed). "Projects shipped" = `cmsProjects()` length. The file doubles as the fallback | Marketing copy that changes rarely. No schema or migration (YAGNI) | A Payload `home` global |
| D23 | Caveat (500–700) via next/font as `--font-hand`, used only for his handwritten notes | His voice, like pencil over the drawing | — |
| D24 | Opt-in UI sound: synthesized WebAudio clicks, off by default, no audio files. One shared module (`tick()`, `thunk()`) | Rajat asked for opt-in UI sounds only. Nothing to download | Audio assets |
| D25 | "Rajat" everywhere: header mark, home, about heading, page titles, JSON-LD `name` | His stated preference | The full name, "RKR" |
| D26 | **Type system, site-wide** (from the Take Apart build sheet; Rajat approved it 2026-10-13): **display** Instrument Sans 700 wdth 75 (name, section and sheet titles, step titles) · **body** Instrument Sans 400/500 wdth 100 (text, thesis) · **labels and data** Martian Mono 500–600 wdth 87.5 · **his voice** Caveat 600, for notes only · **readouts, counts and card numbers** Doto 800. Drafted's `.lab`, `.t-h2`, `.sheet-title` and `.blk-h` are adjusted to it, as in `home-prototype.html` | He rejected the earlier mix (semi-condensed headings with a large regular paragraph) and asked for this one | The Drafted defaults (`.t-h2` wdth 90 600, `.lab` 400) |
| D27 | **No old design remains anywhere public**: every route, plus the OG image, favicon, apple icon, the 404 page and any empty or error state, moves to the new system | Rajat: "complete portfolio website will be rebuilt with the current design system" | Keeping the old OG image and favicon (previously a non-goal) |
| D28 | **No email address on any public page or in JSON-LD.** One `ContactForm` component (home close and `/contact`) is the only way in. It works **without JavaScript**: a native `POST` to `/api/contact`, which also accepts `application/x-www-form-urlencoded` and answers with a `303` to the referring page's path. **Refined 2026-10-13:** the redirect goes to `<path>#sent` or `<path>#send-error`, never `?sent=1`. Reading `searchParams` would make `/` and `/contact` dynamic and lose ISR. The receipt and the error note are server-rendered and shown by CSS `:target`, so pages stay static. The referer is used only when it is same-origin (otherwise `/contact`), so there is no open redirect. JSON requests (fetch) get JSON back, as today. JavaScript adds inline field errors and an `aria-live` status. A filled honeypot `company` gets the normal success answer (JSON 200 or 303 `#sent`) and sends nothing. zod stays the trust boundary. Error copy never points to an email ("Not sent: <reason>. Please try again."). `CONTACT_EMAIL` stays a server-only env var | Rajat: "it should not have my email, instead a contact form should suffice". With no email fallback, the form must work everywhere | Showing the email, or a JS-only form with an email fallback |

**Supersedes**
- D8, D13, §4.5's intro, §4.6's hero rows, §4.7 Q6a's per-letter overlay, P1 step 3 and P3's "Home" bullet: all replaced by P3b below.
- The boot script now only adds `html.js`.

**Data:** `src/content/home.ts` holds:
- lead
- 3 step captions plus the sub-line
- `problems` [{problem, fix}] × 6
- `offerings` [{title, line}] × 6
- facts
- notes

Everything in it is **draft copy for Rajat to confirm**: the offerings (especially "A second look" and "AI where it helps"), "Largest team led: 6 people", the six problems and their fixes, and the notes.

**Files**
- **New:**
  - `src/components/home/stage.tsx` (`"use client"`): a port of the prototype's module. It covers the shards, lines of sight, cards, links, frame, HUD, input, lock, scroll story and resize. Cut-pattern randomness uses a fixed seed (as in the prototype).
  - `src/components/home/name-mark.tsx` (server, inline SVG).
  - `src/components/sound-toggle.tsx` + `src/lib/sound.ts`.
  - `src/content/home.ts`.
  - `src/lib/name-outline.ts` (generated).
  - `src/components/contact-form.tsx` (client island; the routed brief, §0 item 6; also used by `/contact` after P4). It is built in P3b because the home close needs it.
- **Changed:**
  - `src/app/(site)/page.tsx`.
  - `src/app/api/contact/route.ts`: form-encoded plus `303 #sent`/`#send-error`, the same-origin referer, the honeypot and error copy (D28 refined).
  - `layout.tsx`: Caveat, the "Rajat" mark, the Sound toggle in the header tools.
  - `globals.css`: plus the prototype's home CSS (`.exp*`, `.hud`, `.cap*`, `.t3*`, `.sect`, `.who-*`, `.facts`, `.offer`, `.map-*`, `.node*`, `.end*`, `.hand`) and the routed brief's (`.brief*`, `.bin`, `.ruled`, `.msg-wrap`, `.count`, `.chips`/`.chip*`, `.sq`, `.w*`, `.send-*`, `.done-*`, `.hp`).
- **Deps:** + `three` (runtime; a lazy chunk on the home only), + `@types/three` (dev).

### P3b — Home experience (after P3; builder)
1. Generator emits `name-outline.ts` → verify: `NameMark` renders "Rajat." at the prototype's proportions (cap height and the square's size and position within ±2% of the prototype's canvas measure). A second run gives `git diff --exit-code` = 0.
2. Server page with all copy and the SVG name → verify (no-JS context): every section listed above is present, and there is no canvas and no three request.
3. `Stage` lazy-loads three → verify: the reduced-motion context and a WebGL-disabled context (`--disable-webgl`) make no request for the three chunk and show the static page. The default context requests it after the `load` event.
4. Hook → verify (harness, desktop):
   - Focus the stage, press Enter → `[data-locked]` within 1.5 s; the HUD reads "Aligned · 0.0°".
   - Touch context: a sideways drag changes the Turn value, and vertical scrolling still scrolls.
   - Console errors 0.
5. Scroll story → verify:
   - `data-step` is 1/2/3 at scroll fractions 0.2/0.5/0.85 of the stage runway.
   - At step 3 every card's text equals its `fix`.
   - At 390 px no card label overflows its card.
6. Perf → verify (phone 390×844, 4× CPU, `next start`):
   - Home JS before interaction ≤ 35 KB gzip over `/about`'s, excluding the three chunk. (Changed in P5 from a flat ≤ 120 KB:
     React 19 + the Next 16 runtime alone ship on every route and put every page above that, so the gate measures what the home
     adds over a page with only the shared layout's client code.)
   - The LCP element is the `NameMark` SVG.
   - Scrubbing the story holds 60 fps at 1x CPU on the real GPU: frame p50 ≤ 17.5 ms, p95 ≤ 25 ms. (Changed in P5 with Rajat's OK
     from p95 ≤ 25 ms at 4x CPU, which even `/projects` without three misses on the test laptop; 4x is now reported only, and
     real phones are checked on the P6c preview.)

Success: `node scripts/verify-site.mjs --routes /` → `VERIFY OK` in every context of §6.

---

## 1. Summary for Rajat

**What ships:** the Drafted prototype, ported to every route of the live Next.js + Payload app.

**What visibly changes**
- Light "lab" theme only. Dark mode and the theme toggle go away (the prototype is light-only).
- **Home (§0): an experience about you, not your projects.**
  - "Rajat." is cut into shards. The visitor finds the view where they line up, and the name inks (three.js).
  - Scrolling tells how you help a business: parts that don't talk → take them apart → one system.
  - Then Who I am, What I build, a site map to Projects / Blog / About / Contact, and a contact close.
  - Handwritten Caveat notes are your voice.
  - Removed from the home: the skills marquee, about teaser, newsletter form (it never worked) and "Built with" logos (still listing Strapi and Cloudinary).
- **"Rajat" everywhere**: header mark, home, about, page titles. An opt-in **Sound** toggle plays short UI sounds and is off by default.
- **Projects:** the same index of 4 sheets, plus "Earlier works" as a compact table of the other 8 projects
  (no category filter, no cover images).
- **Each featured project page becomes its sheet:** title block, drawing, Problem / What I built / Key decisions /
  Outcome, then the full case study and gallery underneath. Earlier works get the same page without drawing/blocks.
- **Tredye becomes featured as sheet 04.** Order: Offpriced 01, staffing 02, lucif3r 03, Tredye 04 (the prototype's order).
- **Blog, About and Contact** are restyled into the same sheet language. The contact form keeps working
  (browser-native validation, a status line instead of pop-up toasts).
- A "Show construction" button in the header on every page. The drafting cursor appears **only** in construction
  mode: the normal crosshair cursor plus a coordinate readout. The system cursor is never hidden.
- On phones the nav moves from the bottom bar to a second row of the header.

**Decisions taken by default. You can override any of them:**
1. Light theme only. 2. Featured order as in the prototype (Offpriced first; today staffing is first).
3. The index's short "For" and "Kind" text is the part before " — " in each field. So the Offpriced and lucif3r
   title blocks read "a Montréal stocklot house — selling clothing by the lot…" instead of "Offpriced, a Montréal…".
4. Each sheet's stack shows the prototype's 3 highlights first: the technologies lists are reordered for the 4 case studies.
5. Tredye's old in-body flow diagram is removed. Its legend says "signals", which breaks the monitoring rule, and the
   sheet's own drawing replaces it.
6. "Beyond code" (Photography & Videography, Music Production, Video Editing, FPS Gaming, Culinary Arts) stays as a
   plain text list of facts. The game-pad and music-note icons go.
7. Nav labels stay as they are: Projects / Blog / About / Contact.
8. The home loads with your name whole, then it breaks into shards for the visitor to line up. three.js loads only on the
   home, after first paint, and never under reduced motion. The home's copy is draft for you to confirm (§0, Data).
9. Grain: the blend mode is chosen by measurement (P5). Expected result: normal blend, which looks the same at 4%.
10. Verification adds `playwright-core` (dev dependency only) and downloads Playwright's WebKit (~70 MB, into
    `%LOCALAPPDATA%\ms-playwright`) for the Safari-engine checks.

**Open questions (not in this build, listed only)**
- Copy: the about bio and blog post 1 say "real-time trading platforms" / "high-frequency trading". The Tredye case
  study body (`case-study-tredye.md:49`) lists backtesting "win rate, profit factor, Sharpe ratio". The slug is
  `tredye-trading-platform`. All of these pull against the monitoring framing. The backtesting line is already live, and so is
  the old diagram legend's "signals". This build removes the legend.
- `.env.production.local` keeps production credentials in the working tree. Keep it or delete it?
- **Production needs your OK at 3 points** (§7): run the migration, run the content import, merge.
- Optional hardening: make preview builds skip `payload migrate` (§7). It changes the deploy script, so it is your call.

---

## 2. Decisions

| # | Decision | Why | Rejected alternative |
|---|---|---|---|
| D1 | Sheet = plain route `/projects/[slug]` with "← Back to index" + Esc | SSR/ISR/SEO, shareable URL, native back button, no focus trap or scroll lock code, one render path | Intercepting modal route `@modal/(.)projects/[slug]`: two render paths for the same sheet, parallel-route + ISR edge cases. Lost: the clip-path "expand from row" (`drafted.html:1846-1852`) |
| D2 | Drawing data = new Payload `json` field `drawing` holding the prototype's own shape (`drafted.html:775-1123` minus `id/sheet/name`) | Content can land **before** code and old code ignores it, so rollback stays safe. The shape is the one the prototype verified (geometry checks, `verify.mjs:207-219`). Expresses fan-in, walls, LR, skip edge, notes | Extending ```` ```flow ```` in `content`: a v2 object in `content` renders as raw JSON in today's code (`projects/[slug]/page.tsx:346-351` → `parseFlow` rejects non-arrays, `flow-diagram.tsx:113`), so either ordering leaves a broken window and rollback breaks Tredye. The v1 grammar cannot start with a fan-in (`flow-diagram.tsx:116`, asserted `check-flow-diagram.mts:172-179`), has no skip edge, wall, note or LR. Tredye's block must change anyway (legend "signals", `case-study-tredye.md:89`) |
| D3 | Sheet copy = new Payload group `sheet` (short_title, kind, client, problem, built, decisions, outcome) | The 4 blocks are condensed paraphrase with no matching markdown headings (`content.md` gap 4; md has "The problem / What was built / The result" only) | Heading conventions inside `content`: fragile, and it duplicates the narrative |
| D4 | built/decisions stored as textarea, one item per line | 0 extra tables (arrays would add 4 tables incl. versions) | Payload `array` fields |
| D5 | Sheet number = position in the featured list, which is sorted by the existing, unused `featured_order` | Reuses a column. CLAUDE.md notes nothing sorts on it today | New `sheet_no` field |
| D6 | Figure source = `drawing` field. Body markdown has no flow handling. Old `flow-diagram.tsx` + `check-flow-diagram.mts` deleted | Single drawing system. No published content keeps a flow fence after the content step (only Tredye had one, `case-study-tredye.md:65-91`; blog posts have none, and the blog renderer never supported it, `article-content.tsx:173-175`) | Keep v1 renderer for bodies |
| D7 | Layout is a pure TS port of `layout/route/edgeLabels/wallsD/describe` (`drafted.html:1492-1631`) with canvas `tw()` replaced by generated advance tables, and `dominant-baseline` replaced by computed baselines | Deterministic and server-renderable. Under next/font the family is not literally "Instrument Sans", so the prototype's canvas measuring (`:1160`, `:1504`) would silently measure a fallback font. WebKit has historically not honoured `dominant-baseline` on `<tspan>` (unverified here; the computed baseline removes the question) | Canvas measuring at runtime |
| D8 | **Superseded by D21 (§0).** Hero name = outlined SVG paths generated once from the exact Google woff2 (wdth 75, wght 650, GPOS kerning applied), server-rendered. Construction overlay is computed client-side from the same metrics | Removes every runtime glyph API (Q1) and the font-load dependency. Feasibility verified (§4.7 Q6a) | Keep `<text>` + `getStartPositionOfChar` + canvas `measureText` |
| D9 | Drafting animations = CSS keyframes on `pathLength="1"` paths with per-element `--at/--dur` computed by the layout; `drafting` class toggled by the client | Replaces the `Job` engine (`drafted.html:1166-1214`, setTimeouts + inline transitions) with the platform | Port `Job` verbatim |
| D10 | `KIT.loop`/`KIT.spring` dropped. Rule slide → CSS transform transition. Cursor → native crosshair + direct readout | Only 2 users of the loop (`:729-753`, `:1744-1748`) and both have native equivalents | Port the rAF loop |
| D11 | CSS = prototype stylesheet ported verbatim into `src/app/(site)/globals.css` (same class names, content-box sizing). **Tailwind removed entirely** | Tailwind's `.container` utility collides with the prototype's `.container`. Preflight sets `box-sizing:border-box` on `*` (hero W at 1440 would become 1232 instead of 1280) and resets UA margins/lists. After the port no utility class remains | Your lean "Tailwind @theme for tokens": tokens are already plain `:root` vars (`drafted.html:11-34`), so @theme adds nothing |
| D12 | Fonts: `Instrument_Sans({axes:["wdth"]})`, `Martian_Mono()` (no wdth) via next/font, exposed as `--font-sans`/`--font-mono`, plus `Caveat` (500–700) as `--font-hand` (D23) and `Doto` (700–900) as `--font-count` (D26) | Both expose wdth (font-data.json, next 16.2.9: Instrument Sans wdth 75-100, Martian Mono 75-112.5). Martian Mono is only ever used at wdth 100, so skip that axis and the bigger file | Google `<link>` (`drafted.html:2`) |
| D13 | **Changed by §0: the script only adds `html.js`; the intro parts are dropped.** Pre-paint state via one inline `<head>` script: `html.js`, and on `/` only `intro-run` + `--t-ink/--t-fill/--t-dot/--t-end`. `<html suppressHydrationWarning>` (already there, `layout.tsx:107`) | The root layout never re-renders, so React never touches those attributes again. No flash, no mismatch warning | Setting classes in `useEffect` (flash) |
| D14 | Construction mode is not persisted (per tab; it survives client navigation because it lives on `<html>`) | Matches the prototype (`:1923-1928`, no storage). YAGNI | localStorage |
| D15 | Drop: dark mode, Lenis, motion, sonner, react-hook-form, radix/shadcn, lucide, cva/clsx/tailwind-merge, tw-animate-css | None used by the ported UI (§4.3) | Keep "just in case" |
| D16 | Contact form: native constraint validation on the client, zod stays on the server (`api/contact/route.ts:161`) | One trust boundary, no client libs. Native rules cover the schema (`contact-schema.ts:3-19`) | RHF + zodResolver + sonner |
| D17 | Content enters via the existing `scripts/import-case-studies.ts`, extended with a field-level "sync" for existing slugs (dry-run by default, `--execute`, `--content`) | Reuses its guards (local/remote banner, Blob guards, `draftSafe`, PUSH=false) | A Payload data migration (it would run on every preview build against prod) |
| D18 | One data file `src/migration/case-studies/sheets.json` feeds dev content, prod content and the hardcoded fallback | One copy of the sheet copy and drawings | Copying the data into page files |

---

## 3. Data

### 3.1 Drawing format (`drawing` field, also `sheets.json[slug].drawing`)

```ts
type Drawing = {
  nodes: Record<string, string>;                 // id -> label
  edges: [from: string, to: string, label?: string][];
  lay: {
    dir: "TB" | "LR";
    layers: string[][];                          // every node id exactly once; a layer may hold several (lanes / fan-in)
    span?: string[];                             // ids drawn across the full extent of the regular nodes
    walls?: string;                              // id drawn with hatched isolation walls (data kept apart)
    side?: [string, string][];                   // edges routed around the right side (skip edges)
    shift?: number;                              // 0..1 cross-axis position for single-node layers (default 0.5)
  };
  notes?: [ids: string[] /* or ["all"] */, text: string][];   // dimension-style facts under the drawing (sheet only)
};
```
`parseDrawing(v: unknown): Drawing | null` never throws. It rejects: non-object, an empty or non-string label, an edge
or note or span/walls/side id that is not a node, a node missing from `layers` or listed twice, dir ∉ {TB, LR},
shift ∉ [0,1]. The Payload field uses it as `validate`.

**The four drawings, ready to paste (verbatim from `drafted.html:775-1123`):**
```json
{
  "b2b-wholesale-platform": {
    "nodes": {"public":"The public","buyers":"Signed-in buyers","staff":"The team working those deals","editors":"Whoever edits the site","app":"One application","db":"One database"},
    "edges": [["public","app"],["buyers","app"],["staff","app"],["editors","app"],["app","db","one codebase, one database"]],
    "lay": {"dir":"TB","layers":[["public","buyers","staff","editors"],["app"],["db"]],"span":["app","db"]},
    "notes": [[["public","buyers","staff","editors"],"four audiences, one application"],[["public"],"The Floor: lots from 57 factories, trade only"],[["app"],"Payload CMS embedded: one deployment, one login"]]
  },
  "staffing-operations-platform": {
    "nodes": {"admin":"Admin","client":"Client","worker":"Worker","partner":"Partner","onboarding":"Onboarding","core":"Shared core","db":"Database — row-level security"},
    "edges": [["admin","core"],["client","core"],["worker","core"],["partner","core"],["onboarding","core"],["core","db"]],
    "lay": {"dir":"LR","layers":[["admin","client","worker","partner","onboarding"],["core"],["db"]],"span":["core","db"],"walls":"db"},
    "notes": [[["all"],"927 automated tests run against all of it"],[["admin","client","worker","partner","onboarding"],"five portals, one login"],[["db"],"row-level security checks every read and write"]]
  },
  "esports-talent-portfolio": {
    "nodes": {"cms":"Control Room (Payload CMS)","db":"PostgreSQL","live":"Live pages"},
    "edges": [["cms","db","stores content"],["cms","live","publish"],["db","live","serves"]],
    "lay": {"dir":"TB","layers":[["cms"],["db"],["live"]],"side":[["cms","live"]],"shift":0.4},
    "notes": [[["cms"],"live preview, draft/publish, editable brand colours"],[["live"],"measured in qualified enquiries, not pageviews"]]
  },
  "tredye-trading-platform": {
    "nodes": {"kite":"Kite Connect","ingestion":"Data ingestion","candles":"Candle builder","rsi":"RSI calculator","divergence":"Divergence detector","macd":"MACD calculator","macdstrategy":"MACD strategy detector","gateway":"API gateway","dashboard":"Next.js dashboard"},
    "edges": [["kite","ingestion","WebSocket"],["ingestion","candles","Kafka · ticks"],["candles","rsi","Kafka · candles"],["candles","macd","Kafka · candles"],["rsi","divergence","Kafka · RSI"],["macd","macdstrategy","Kafka · MACD"],["divergence","gateway","Kafka · alerts and setups"],["macdstrategy","gateway","Kafka · alerts and setups"],["gateway","dashboard","WebSocket"]],
    "lay": {"dir":"TB","layers":[["kite"],["ingestion"],["candles"],["rsi","macd"],["divergence","macdstrategy"],["gateway"],["dashboard"]]},
    "notes": [[["rsi","divergence"],"~800 live RSI streams: ~200 NSE stocks × 4 timeframes"],[["candles"],"candles aligned to the 9:15 IST open"],[["gateway"],"live board pushed from Redis every 2 s"],[["all"],"Kafka 4.1 in KRaft mode, no ZooKeeper to operate"]]
  }
}
```

### 3.2 Deterministic layout and everything derived from it (`src/lib/drawing.ts`, pure, no DOM)

- `drawLayout(d, {W, H, fs, efs, nfs, notes})` ports `layout()` `:1502-1542`, `route()` `:1544-1561`, `ptsD/boxD/arrowD`
  `:1562-1568`, `wallsD` `:1570-1579`, `nodeLabel` `:1580-1588`, `edgeLabels` `:1589-1621`, the note rows `:1638-1647`
  and the drawing passes of `drawDiagram` `:1658-1721` **line by line**. Change only these things:
  - `tw(s, font)` → `textWidth(s, "label"|"mono", px)`, which sums advances from `src/lib/font-metrics.ts`
    (Instrument Sans wght 500 wdth 100 for `.d-label`; Martian Mono 400 for `.d-elabel/.d-note/.c-txt`, plus the
    prototype's `+ len*px*0.02 + 2` tracking terms). An unknown char counts as the width of "n".
    `ponytail:` kerning ignored, ±2% width; boxes carry ≥ `fs*0.8` px padding.
  - `dominant-baseline: central` → `y + font.central*px` (`central` = (hhea ascender + descender)/2/upm, generated).
  - The DOM-building calls return mark objects instead: `{tag, cls, d|x,y,w,h|text, layer:"cons"|"ink", anim:"pen"|"ink"|"set"|null, at, dur}`.
    `at/dur` follow the `Job` schedule exactly (pen: `len/SPEED`; ink: `T(1/16)` or `T(1/8)`; set: `T(1/32)`; phase starts `q()`-quantized).
    Path lengths are computed analytically (orthogonal polylines, rect perimeters, wall segments).
  - Returns `{W, H /* = HH incl. note rows */, marks, end}`.
- `describe(d, name)` = `:1622-1631` verbatim → `.dia-text` (always `.sr-only`) and the panel svg `aria-label`.
  Same data, so they cannot drift.
- Construction layer = the `layer:"cons"` marks (registration marks, layer axes, centre axis, construction boxes and
  connectors, note extension lines), all derived from the same geometry. The px readouts ("W × H px" in the panel head,
  "Architecture, drawn 1:1 · W × H px" in the sheet caption) print the layout's `W` and `H`.
- `DrawingView` (`src/components/drawing-view.tsx`, no `"use client"`, so it renders on server or client) maps marks to
  `<svg class="dia" viewBox="0 0 W H" data-project data-state>` with `<g class="cons">` + ink `<g>`. Pen/ink paths get
  `pathLength="1"` and `style={{"--at": at+"ms", "--dur": dur+"ms"}}`. CSS:
  ```css
  .drafting .a-pen,.drafting .a-ink{stroke-dasharray:1 1;animation:dash var(--dur) linear var(--at) backwards}
  .drafting .a-ink{animation-timing-function:var(--ease-attack)}
  .drafting .a-set{animation:appear var(--t32) var(--ease-attack) var(--at) backwards}
  @keyframes dash{from{stroke-dashoffset:1}to{stroke-dashoffset:0}} @keyframes appear{from{opacity:0}}
  @media (prefers-reduced-motion:reduce){.drafting *{animation:none!important}}
  ```
  The client sets `drafting` (never under reduced motion), then after `end+34` ms removes it and sets `data-state="inked"`.
- Options (from the prototype): panel `{fs:13, efs:10, nfs:10, H:460 /* .dia-box */, notes:false}` (`:1750`). Sheet
  `{fs:15|13, efs:11|10, nfs:11|10, H:540|470, notes:true}` for innerWidth ≥720 or below (`:1817-1820`).
  If the layout needs more height, H grows (`:1637`).

### 3.3 Sheet fields, Payload definitions, migration

Mapping of what the prototype shows:

| Prototype | Source |
|---|---|
| short name (index row, sheet title) | **new** `sheet.short_title` |
| kind (sh-head label, title block; index shows text before " — ") | **new** `sheet.kind` |
| for (title block; index shows text before " — ") | **new** `sheet.client` |
| one-liner | existing `description` (verbatim, e.g. `case-study-wholesale.md:5`) |
| stack (title block full; index first 3 + "+N more") | existing `technologies[]` (reordered, D-summary 4) |
| sheet no. "01 / 04" | position in the featured list sorted by existing `featured_order` |
| drawing | **new** `drawing` (json) |
| Problem / What I built / Key decisions / Outcome | **new** `sheet.problem`, `sheet.built`, `sheet.decisions`, `sheet.outcome` |
| "Full case study" | in-page link `#case-study` to the markdown body rendered below the blocks |

Fields to add to `src/payload/collections/Projects.ts` (after `content`; also set `featured_order` admin description
"Sheet order among featured projects, 1 = first"):
```ts
{
  name: "sheet",
  type: "group",
  admin: { description: "Featured case studies only: the sheet's title block and its four blocks." },
  fields: [
    { name: "short_title", type: "text", admin: { description: "Index and sheet title, e.g. Offpriced" } },
    { name: "kind", type: "text", admin: { description: "What it is. The index shows the part before ' — '." } },
    { name: "client", type: "text", admin: { description: "Who it was for (never name an anonymous client). The index shows the part before ' — '." } },
    { name: "problem", type: "textarea" },
    { name: "built", type: "textarea", admin: { description: "What I built — one item per line" } },
    { name: "decisions", type: "textarea", admin: { description: "Key decisions — one item per line" } },
    { name: "outcome", type: "textarea" },
  ],
},
{
  name: "drawing",
  type: "json",
  validate: (v: unknown) => v == null || parseDrawing(v) !== null || "Invalid drawing — see src/lib/drawing.ts",
  admin: { description: "Architecture drawing shown as the sheet's figure (shape: src/lib/drawing.ts)." },
},
```
Column naming follows `20260612_000000_initial.sql`: `projects` uses bare snake_case (`:411-428`), `_projects_v`
uses a `version_` prefix (`:93-114`). Text and textarea map to `character varying` (`description`, `:415`).
**Wiring:** there is no migrations `index.ts`. Payload reads every `*.ts|*.js` in `src/migrations`, sorted, excluding
`index.*`; the name is the basename before the first `.` (`node_modules/payload/dist/database/migrations/readMigrationFiles.js`,
`findMigrationDir.js` → `src/migrations`). So the new file only needs to sort after `20260612_…` and have no extra dots.

`src/migrations/20261013_000000_drafted_sheet_fields.ts`:
```ts
/** Additive, idempotent (IF [NOT] EXISTS): safe against push-created dev columns and re-runs. */
import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export const UP_SQL = `
ALTER TABLE payload.projects
  ADD COLUMN IF NOT EXISTS sheet_short_title character varying,
  ADD COLUMN IF NOT EXISTS sheet_kind character varying,
  ADD COLUMN IF NOT EXISTS sheet_client character varying,
  ADD COLUMN IF NOT EXISTS sheet_problem character varying,
  ADD COLUMN IF NOT EXISTS sheet_built character varying,
  ADD COLUMN IF NOT EXISTS sheet_decisions character varying,
  ADD COLUMN IF NOT EXISTS sheet_outcome character varying,
  ADD COLUMN IF NOT EXISTS drawing jsonb;
ALTER TABLE payload._projects_v
  ADD COLUMN IF NOT EXISTS version_sheet_short_title character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_kind character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_client character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_problem character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_built character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_decisions character varying,
  ADD COLUMN IF NOT EXISTS version_sheet_outcome character varying,
  ADD COLUMN IF NOT EXISTS version_drawing jsonb;`;

export const DOWN_SQL = `
ALTER TABLE payload.projects
  DROP COLUMN IF EXISTS sheet_short_title, DROP COLUMN IF EXISTS sheet_kind, DROP COLUMN IF EXISTS sheet_client,
  DROP COLUMN IF EXISTS sheet_problem, DROP COLUMN IF EXISTS sheet_built, DROP COLUMN IF EXISTS sheet_decisions,
  DROP COLUMN IF EXISTS sheet_outcome, DROP COLUMN IF EXISTS drawing;
ALTER TABLE payload._projects_v
  DROP COLUMN IF EXISTS version_sheet_short_title, DROP COLUMN IF EXISTS version_sheet_kind, DROP COLUMN IF EXISTS version_sheet_client,
  DROP COLUMN IF EXISTS version_sheet_problem, DROP COLUMN IF EXISTS version_sheet_built, DROP COLUMN IF EXISTS version_sheet_decisions,
  DROP COLUMN IF EXISTS version_sheet_outcome, DROP COLUMN IF EXISTS version_drawing;`;

export async function up({ db }: MigrateUpArgs): Promise<void> { await db.execute(sql.raw(UP_SQL)); }
export async function down({ db }: MigrateDownArgs): Promise<void> { await db.execute(sql.raw(DOWN_SQL)); }
```
The names above are predicted. **The push-parity test below decides.** If it disagrees, change the SQL to match what
drizzle push created.

**Migration test from an EMPTY database (P2):**
```powershell
podman run -d --rm --name drafted-mig  -p 5436:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload -e POSTGRES_DB=payload postgres:16-alpine
podman run -d --rm --name drafted-push -p 5437:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload -e POSTGRES_DB=payload postgres:16-alpine
# A: migrations from empty
$env:DATABASE_URI = "postgresql://payload:payload@localhost:5436/payload"
node_modules\.bin\payload.cmd migrate          # expect "Migrated: 20260612_000000_initial" then "Migrated: 20261013_000000_drafted_sheet_fields"
node_modules\.bin\payload.cmd migrate:status   # expect both listed as ran
# B: drizzle push from empty (dev server init), then stop it
$env:DATABASE_URI = "postgresql://payload:payload@localhost:5437/payload"
npm run dev   # (background) then: curl.exe -s -o NUL http://localhost:3000/ ; stop the server
# compare full column lists of both tables (A must equal B; A contains the 16 new sheet_/drawing columns)
$q = "select table_name||'.'||column_name||':'||data_type from information_schema.columns where table_schema='payload' and table_name in ('projects','_projects_v') order by 1"
podman exec drafted-mig  psql -U payload -d payload -At -c $q > A.txt
podman exec drafted-push psql -U payload -d payload -At -c $q > B.txt
Compare-Object (Get-Content A.txt) (Get-Content B.txt)          # expect: no output
# idempotency + down, on A
node_modules\.bin\tsx.cmd -e "import('./src/migrations/20261013_000000_drafted_sheet_fields.ts').then(m=>console.log(m.UP_SQL))" | podman exec -i drafted-mig psql -U payload -d payload -v ON_ERROR_STOP=1   # expect NOTICEs "already exists, skipping", exit 0
node_modules\.bin\tsx.cmd -e "import('./src/migrations/20261013_000000_drafted_sheet_fields.ts').then(m=>console.log(m.DOWN_SQL))" | podman exec -i drafted-mig psql -U payload -d payload -v ON_ERROR_STOP=1 # exit 0; the filter query then returns 0 sheet_/drawing rows
podman stop drafted-mig drafted-push ; Remove-Item A.txt,B.txt
```
(Ports 5436/5437 because 5435 belongs to `laborithmwebapp-db-1`. `migrate:down` is not used: on an empty DB both
migrations share batch 1 and it would drop the whole schema.)

### 3.4 `src/migration/case-studies/sheets.json` (one source: dev, prod, fallback)
Keyed by slug; per entry: `featured_order`, `description`, `technologies`, `sheet{short_title, kind, client, problem,
built[], decisions[], outcome}`, `drawing` (§3.1). The import script asserts `description`/`technologies` equal the md
header and throws on drift. Values:

| slug | order | short_title | kind | client |
|---|---|---|---|---|
| b2b-wholesale-platform | 1 | Offpriced | B2B Wholesale Platform | a Montréal stocklot house — selling clothing by the lot to retailers and wholesalers buying surplus, cancelled orders and factory over-runs in bulk |
| staffing-operations-platform | 2 | Staffing operations platform | a small ERP, built from scratch | a staffing company |
| esports-talent-portfolio | 3 | lucif3r | a website with one job — turn a tournament organiser or a brand’s event manager into a booking enquiry | an esports caster, stage host and broadcast voice — working across esports finals, brand launches and live conventions |
| tredye-trading-platform | 4 | Tredye | Real-Time NSE Market Monitoring on an Event-Driven Stack | Voltvave Innovations |

- problem/built/decisions/outcome: copy **verbatim** (curly quotes included) from the static sheets. Offpriced
  `drafted.html:456-459`, staffing `:489-492`, lucif3r `:522-525`, Tredye `:555-558`. Each `<li class="ln">` becomes one
  array item; the `<p class="ln">` text becomes the string.
- technologies (the prototype's index highlights first, `:397-400`; also edit the 4 md headers to match):
  Offpriced: Next.js, Payload CMS, PostgreSQL, React, TypeScript, Cloudflare R2, Resend, Vercel, Progressive Web Apps, Web Push, Model Context Protocol ·
  staffing: Next.js, Drizzle ORM, PostgreSQL, React, TypeScript, Turborepo, Better Auth, CASL, Row-Level Security, State Machines ·
  lucif3r: Payload CMS, Lenis, Vercel Blob, Next.js, React, TypeScript, PostgreSQL, Tailwind CSS, Resend, Cloudflare Turnstile, Vitest, Playwright, Vercel ·
  Tredye: Python, Apache Kafka, Redis, FastAPI, PostgreSQL, TA-Lib, Kite Connect, Next.js, React, TypeScript, Tailwind CSS, WebSockets, Docker, Nginx, Razorpay.
- descriptions: the md header value as-is (staffing keeps its straight apostrophe "company's").
- `src/lib/cms/fallback.ts` builds `FALLBACK_SHEETS` (4 index rows incl. drawings) from this file. `FALLBACK_EARLIER`
  is the existing 8 non-case-study entries from `projects/page.tsx:50-94` without `imageUrl`. **Delete its Tredye entry**:
  "Real-time trading platform … order management" (`:41-49`) breaks the monitoring rule. `FALLBACK_POSTS` comes from
  `blog/page.tsx`. Sheet pages keep `notFound()` when the DB has nothing (unchanged behaviour).

### 3.5 Content path

**Script changes (`scripts/import-case-studies.ts`):**
- `CASE_STUDIES` holds 4 entries: the existing 3 with `featured_order` per the table above, plus a new Tredye entry
  (`case-study-tredye.md`, `featured_order: 4`, `start_date: "2025-11-01"`, `images: []`).
- Existing slugs (today they only get `featured`, `:260-277`): compute
  `want = {featured:true, featured_order, title, description, live_url, technologies, sheet, drawing, ...(--content ? {content} : {})}`.
  Print one line per field, `same` or `change (old n → new m chars)`, comparing with `util.isDeepStrictEqual` (jsonb
  reorders object keys, so a string compare never reads `same`). For every changed text field (`content`, `description`, the sheet
  texts) also print the lines found only in the current value and the lines found only in the new value (set
  difference, max 40 each): a line only in the current value is an admin edit the update would overwrite.
  With `--execute`, and only if `draftSafe` passes (reuse `:239-246`): first write the current values of every field
  about to change to `scripts/backups/<slug>-<timestamp>.json` (gitignored; abort on write failure), then call
  `payload.update({collection:"projects", id, data: changedFieldsOnly})`. Never pass `_status`.
  `built`/`decisions` arrays are written joined with `"\n"`.
- New slugs: create as today, plus `sheet` and `drawing`.
- Also print, per existing doc, the count of ```` ```flow ```` fences left in `content` (should be 0 after the step).
- Flags only reach the script after a bare `--`. In PowerShell use `payload.cmd`.
- Keep every new import dynamic and after the existing guards (`import-case-studies.ts:91-95`, `:123`). Read `sheets.json` with `fs`,
  never through `@/lib/cms`: a static import that reaches `@payload-config` loads the config before `PAYLOAD_DB_PUSH=false` is set
  and would drizzle-push the target DB (in P6b: production, leaving a `batch -1` row that blocks every later `payload migrate`).

**Repo content edits (P2):** remove `case-study-tredye.md:65-91` (the flow block; the section's prose stands on its
own). Reorder the 4 `technologies:` headers.

**(a) Dev DB:** `npm run dev` (push adds the columns) → if the DB is empty, `curl.exe -X POST http://localhost:3000/api/dev-import`
→ stop dev →
`node_modules\.bin\payload.cmd run scripts/import-case-studies.ts -- --content` (dry-run, banner `local`) →
`… -- --content --execute` → run the dry-run again: every field `same`, 4 featured in order 1-4, 0 flow fences.
(dev-import resets `featured`/`featured_order` from seed data, so re-run the import after any dev-import.)

**(b) Production:** a separate step Rajat confirms. See §7 / P6. No builder phase touches production.

---

## 4. Architecture

### 4.1 File map (paths under `frontend/`)

**New**
- `scripts/font-metrics.py`: generator (fontTools; §4.7 Q6a) → `src/lib/font-metrics.ts` (generated, committed).
- `src/lib/tempo.ts`: `BEAT=500, T(n)=n*4*BEAT, SPEED=400/T(1/8), GRID=T(1/16), q()` (`drafted.html:1129-1132`).
- `src/lib/drawing.ts` (pure: types, `parseDrawing`, `drawLayout`, `describe`, `textWidth`) · `src/components/drawing-view.tsx`.
- `src/components/site-chrome.tsx` (`"use client"`: `Header` = mark + nav with `aria-current` + `ConstructionToggle`; `Footer` = "Elsewhere" (GitHub, LinkedIn) + place, no email (D28); both SSR'd).
- `src/components/construction.tsx` (client: `ConstructionToggle`, `Guides`, `CursorReadout`).
- `src/components/hero.tsx` (server: meta, outlined ink SVGs, role/process, hint) · `src/components/hero-construction.tsx` (client overlay).
- `src/components/works-index.tsx` (client; SSR'd table) · `src/components/sheet-figure.tsx` (client) · `src/components/sheet-keys.tsx` (client: Esc/back/focus).
- `src/components/reveal.tsx` (client: `Reveal` = kit-reveal; `PenBlocks` = `.blk` is-in + per-line `--i/--d`).
- `src/components/copy-button.tsx` (client; port of `:1937-1948`) · `src/components/markdown.tsx` (server) · `src/components/contact-form.tsx` (client).
- `src/migrations/20261013_000000_drafted_sheet_fields.ts` · `src/migration/case-studies/sheets.json` · `src/lib/cms/fallback.ts`.
- `scripts/check-drawing.mts` · `scripts/verify-site.mjs` · `scripts/measure-grain.mjs`.

**Changed**
- `src/app/(site)/layout.tsx`, `globals.css` (full replacement), `page.tsx`, `projects/page.tsx`, `projects/[slug]/page.tsx`,
  `blog/page.tsx`, `blog/[slug]/page.tsx`, `about/page.tsx`, `contact/page.tsx`.
- `src/payload/collections/Projects.ts`, `src/payload-types.ts` (regenerate), `src/lib/cms/index.ts` (map `sheet`/`drawing`,
  featured sort by `featured_order` asc then start_date desc), `src/lib/cms/types.ts`.
- `src/components/gallery-video.tsx` (`useInView` from motion → `IntersectionObserver`).
- `scripts/import-case-studies.ts`, the 4 case-study md files, `package.json`/lock, `next.config.ts` (drop image hosts with
  zero references, e.g. simpleicons/iconify, after grep), `CLAUDE.md`.

**Deleted**
- `src/styles/custom.css`, `src/providers/*`, `src/components/{ui,layout,sections,animations,about,blog,forms,projects}/*`,
  `src/lib/utils.ts`, `src/app/(site)/projects/projects-client.tsx`, `src/app/(site)/blog/blog-page-client.tsx`,
  `scripts/check-flow-diagram.mts`, `postcss.config.mjs`, `components.json`.
- Deps: motion, lenis, next-themes, lucide-react, sonner, react-hook-form, @hookform/resolvers, @radix-ui/react-{dialog,separator,slot,switch},
  class-variance-authority, clsx, tailwind-merge, tw-animate-css, tailwindcss, @tailwindcss/postcss.
  **Kept:** react-markdown, remark-gfm, zod (server), resend, graphql, all @payloadcms/*.
  Added (dev): playwright-core (verification harness only; no browser download on install, no runtime effect).
- Pre-existing dead code, not caused by this port. **Mention only, do not delete:** `date-fns` (no importers),
  `src/lib/utils/reading-time.ts`, `public/{file,globe,window}.svg`.

### 4.2 Server/client split per route

| Route | Server | Client islands |
|---|---|---|
| layout | boot script, fonts, skip link (`#main`), grain div, `<main id="main">` | `Header` (nav, `ConstructionToggle`, `SoundToggle`), `Guides`, `CursorReadout` |
| `/` | all copy (`src/content/home.ts`), `NameMark` SVG, projects count, `revalidate=3600` (§0) | `Stage` (three.js, lazy), `ContactForm` (enhancement only; posts natively without JS) |
| `/projects` | data, Earlier works table | `WorksIndex`, `Reveal` |
| `/projects/[slug]` | sheet markup, title block, blocks text, `Markdown` body, gallery, `generateStaticParams`/`generateMetadata` | `SheetFigure` (SSR canonical W=848 for no-JS), `PenBlocks`, `GalleryVideo`, `SheetKeys` |
| `/blog` | everything | `Reveal` |
| `/blog/[slug]` | `Markdown`, TOC, related, share links (absolute URLs, plain anchors) | `CopyButton` (copy link) |
| `/about` | everything | none |
| `/contact` | everything | `ContactForm` |

Unchanged: sitemap, robots, the root-layout JSON-LD, `revalidate=3600` on every CMS page, published-only queries (`lib/cms/index.ts:107`).

### 4.3 CSS strategy
- `src/app/(site)/globals.css` = `drafted.html:11-345` verbatim, minus the drafting-cursor rules `:101-140`.
  Replace font names with `var(--font-sans)` / `var(--font-mono)`, keeping fallbacks (`var(--font-sans), 'Arial Narrow', sans-serif`).
  **No global box-sizing reset** (the prototype is content-box). `:179` stays as static values. The JS rewrite
  `:1141-1143` is a no-op because the values are equal.
- Additions, in the same vocabulary: `.nav/.nav-a` (11px mono uppercase, 44px), `.needs-js` (`html:not(.js) .needs-js{display:none}`),
  `.no-js-only` (`.js .no-js-only{display:none}`), `.name-ink`/`.ink-1`/`.ink-2`, `.row-sub`, `.prose`, `.plates/.plate`, `.toc`,
  `.progress`, `.form/.field/.in/.err`, `.sheet-title--long`, `.dia-ssr`, `.cursor-readout`, and the keyframes in §3.2 and §4.5.
- `.dia-text` is always sr-only now: the figure is SSR'd for no-JS readers, so the prototype's no-JS swap `:301-303` is not needed.
- Script-revealed states are gated in CSS, never by SSR classes: `.js .blk:not(.is-in) .ln{…}`,
  `.js .tb:not(.is-in) .tb-sheet::before{transform:scaleX(0)}`, `.js .sec-head:not(.is-in){transform:translateY(12px)}`.
  Wrap the motion ones in `@media (prefers-reduced-motion:no-preference)`. Clients only add `.is-in`.
- `.rule` spring → `transition: transform var(--t8) var(--ease-attack)`.
- Mobile header: `@media (max-width:719px){ .top-in{flex-wrap:wrap} .nav{order:3;width:100%;justify-content:space-between;border-top:1px solid var(--hairline)} html{scroll-padding-top:120px} }`.

### 4.4 Fonts
```ts
const sans = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans", display: "swap" });
const mono = Martian_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
```
Both fonts are variable for weight. Used weights: sans 400/450/500/600/650/700, mono 400/600.
Google's CSS declares `font-stretch: 75% 100%` (checked), so `font-stretch:75%|85%` works.

### 4.5 Boot script (inline in `<head>`). **Superseded by §0:** the script only adds `html.js`; the intro timing below is dropped.
```ts
const BOOT = `(function(){var d=document.documentElement;d.classList.add('js');
if(location.pathname!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var c=d.clientWidth,W=Math.min(c-(c<=640?32:48),1280),G=${GRID},q=function(m){return Math.ceil(m/G-1e-6)*G},
i=q(W/${SPEED}),f=i+${T(1 / 8)},o=Math.ceil((f+G)/${T(1 / 4)})*${T(1 / 4)},s=d.style;
d.classList.add('intro-run');s.setProperty('--t-ink',i+'ms');s.setProperty('--t-fill',f+'ms');
s.setProperty('--t-dot',o+'ms');s.setProperty('--t-end',(o+${T(1 / 2)})+'ms')})()`;
```
(These are the prototype's tInk/tFill/tDot/end, `:1372`, `:1386`, with W per `.container` `:72-76,190`.)
Intro CSS:
`html.intro-run .name-ink .g{stroke-dasharray:1 1;animation:dash var(--t8) var(--ease-attack) var(--t-ink) backwards,fill-in var(--t32) var(--ease-attack) var(--t-fill) backwards}`,
`@keyframes fill-in{from{fill-opacity:0}}`, dot `appear` at `--t-dot`.
`.role` / `.process span:nth-child(n)` animate `color` from `--blue` at `--t-fill + 125ms × (1, 2, 3)` (`:1384-1385`).
The ink lands from CSS alone even if hydration never happens.
`HeroConstruction` mounts late: it offsets its pen delays by `-performance.now()` so they join the same timeline,
and at `--t-end` (or on unmount) it removes `intro-run` and sets `data-intro="done"`.

### 4.6 Engine port (Q1 answer → mechanism). The hero rows (intro, glyph measuring, letter construction) are superseded by §0.

| Behaviour (prototype lines) | Port |
|---|---|
| Tempo tokens `:1129-1143`, CSS `:179` | `tempo.ts` + static CSS vars |
| Intro: construct → ink `:1286-1390`, `:1409-1417`, boot `:1990-1995`, safety `:1982` | boot script + CSS (§4.5) + `HeroConstruction` |
| Hero glyph measuring `:1247-1263`, `:1289-1320` | **gone**: outlined paths + generated metrics. Ink = SSR `<svg viewBox>` in font units, `width: calc(100% - max(72px, 7%))` (gut `:1292`), two-line variant via `@container (width < 640px)` on `.name` (`:1291`), `.name{padding:44px 0 34px}` (`:1301-1303`). Overlay at 1:1 px, F from the ink svg's rendered width |
| Letter construction `:1266-1284`, `:1326-1369`; hover hit-test `:1392-1407` | `HeroConstruction` (verbatim maths, pointer handlers; arcs from outline bboxes; stem = width of "I") |
| Guides `[data-cons]` + `#guides` + px dims `:1217-1234`, `:1423-1486` | `Guides` client (absolute svg over the document; same rules; refresh on toggle, resize, pathname, fonts `loadingdone`) |
| Construction toggle `:1922-1929` (no persistence) | `ConstructionToggle` sets `html[data-construction]`, label swap; `.needs-js` |
| Works index ↔ panel, rule, inline panel, taps `:1736-1809`; auto-select row 0 `:1983-1986` | `WorksIndex`: state `sel`; panel rendered in the aside **or** as `<tr class="panel-row">` after the selected row when `(max-width:719px),(pointer:coarse) and (max-width:1199px)` (`useSyncExternalStore(matchMedia)`), no DOM moving; "Open sheet NN" = link; first touch tap drafts and scrolls into view, second navigates |
| Architecture renderer `:1492-1729` | `drawing.ts` + `DrawingView` (§3.2) |
| Inspect `:1815-1917`, Esc `:1930-1932` | route (D1). `SheetKeys`: Esc / "← Back to index" do `router.back()` if `WorksIndex` set the module flag `cameFromIndex`, else go to `/projects`; focus `#t-<slug>` (tabindex -1, preventScroll) only when `cameFromIndex` |
| Block reveal `.blk.pre` `:333-338`, `:1880-1887` | `PenBlocks` (IO threshold .12 adds `.is-in`, sets `--i` and `--d = width/SPEED`) |
| `KIT.reveal` `:669-683` | `Reveal` |
| Drafting cursor `:721-760` + `cursor:none` `:102-112` | `CursorReadout` (§4.7 Q6c) |
| Grain `:91-99`, `:349` | CSS div in layout (§4.7 Q6b) |
| `KIT.loop`/`KIT.spring` `:606-666` | dropped (D10) |
| `KIT.debug` `#debug` `:686-710`, `KIT.ready` `:713-718` | dropped (the harness waits on `data-intro`/`data-state`) |
| Copy email `:1937-1948` | **dropped** (D28: no email shown). `CopyButton` remains only for "Copy link" on posts |

### 4.7 Open items from HANDOFF.md (Q6a-d)

**Q6a: WebKit letter metrics → outline the name (generator `scripts/font-metrics.py`).** Updated by §0: the generator
also emits `src/lib/name-outline.ts` ("Rajat." only) for the home's `NameMark` and shard texture. The per-letter
construction overlay and the 12-letter-box check are dropped. Python 3.13 + fontTools 4.63 + brotli are
installed (miniconda). Network to Google Fonts works. Steps 1-2 below were run in this session with these results: latin woff2
loaded, wdth/wght axes present, upm 1000, instance OK, cap 720, xh 510, kerning R·a −7, a·j +2, j·a −7, a·t −4, K·u −21,
m·a −5, total advance 4866 units.
1. GET `https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&display=swap` with a Chrome User-Agent.
   Take the `/* latin */` woff2 (the same file next/font downloads) and load it with `TTFont(BytesIO(...))`.
2. `instancer.instantiateVariableFont(font, {"wdth": 75, "wght": 650})`. For the chars of "Rajat Kumar R" and "HxoI": advance (`hmtx`),
   bounds (`BoundsPen`), outline (`SVGPathPen`, y negated so paths are y-down), GPOS pair kerning from the `kern` feature
   (PairPos formats 1/2, unwrap Extension type 9; per lookup the first matching subtable wins; sum across lookups, as HarfBuzz does).
   Metrics: cap = H.yMax, xh = x.yMax, os = o.yMax − x.yMax, desc = −j.yMin, stem = I.xMax − I.xMin.
3. Label table: a second instance at wdth 100, wght 500 → advances for U+0020-007E plus `—–‘’·×é`, and
   `central = (hhea.ascent + hhea.descent) / 2 / upm`.
4. Martian Mono (`family=Martian+Mono:wght@400`): the advance of "0" (assert every ASCII advance is equal) and `central`.
5. Write `src/lib/font-metrics.ts` with sorted keys and fixed rounding, so re-runs are byte-identical.
The server ink uses `NAME` (paths positioned at advance + kern; dot = `stem*1.1` square at `end + 50` units; viewBox width = run + 210 units, `:1296`).
**Result:** no runtime glyph API anywhere and no dependence on the font having loaded. The verify letter-box check (≤2 px) becomes a
regression test of overlay vs ink.

**Q6b: grain cost (`scripts/measure-grain.mjs`).** System Chrome via playwright-core, context 390x844 @3, touch, against `next start`.
Use CDP `Emulation.setCPUThrottlingRate {rate: 4}`. Three variants: grain off (`.kit-grain{display:none}`), `multiply` (prototype), `normal`.
For each: load `/`, wait for `data-intro=done`, then in-page scroll `scrollBy(0, 8)` per rAF for 300 frames down and 300 up, recording
`performance.now()` deltas. 3 runs, report the median p50/p95 frame ms and % frames > 25 ms. Visual: screenshot `/projects/staffing-operations-platform`
under multiply vs normal, mean absolute channel difference via canvas (as `verify.mjs:113-161` reads pixels).
**Decision rule:** if mean |Δ| ≤ 1.0/255 (expected: at 4% opacity multiply and normal differ by ≈0.002), ship `mix-blend-mode: normal`.
Then if p95(normal) ≤ 1.10 × p95(off) and dropped%(normal) ≤ dropped%(off) + 2 points, keep grain everywhere; otherwise add
`@media (pointer: coarse){.kit-grain{display:none}}`. Swiftshader compositing makes this an upper bound.

**Q6c: drafting cursor.** Your lean, with refinements:
- `@media (pointer:fine){ html[data-construction=on]{cursor:crosshair} html[data-construction=on] :is(a,button,input,textarea,select,label,summary,[contenteditable]){cursor:revert} }`.
- `CursorReadout` (client, `aria-hidden`) shows a mono `x 0412 · y 0187` (`:740-741`) offset 14 px. It moves by `transform` on `pointermove`,
  rAF-throttled and direct (no spring). It hides over the interactive elements above, on `pointerleave` of the document, and when construction is off.
- No `cursor:none` anywhere. Delete the `.kit-cursor*` rules.

**Q6d: tablets.** Contexts 768x1024 and 1024x1366, `isMobile`, `hasTouch`, DPR 2. Both fall under the inline-panel query, so the checks
are the phone's (first tap drafts and keeps the drawing in view; second tap opens).
Playwright here: **playwright-core is not resolvable** from `frontend/` or `design/` (only from other projects). `%LOCALAPPDATA%\ms-playwright` has
chromium-1217/1223/1234 + headless shells + ffmpeg, **no webkit, no firefox**. System Chrome exists (`verify.mjs:521-525` launches it).
Hence P0 adds playwright-core and P5 installs WebKit.

---

## 5. Phases (all sequential: P3 and P4 would share `.next` and `globals.css`; parallel only in separate worktrees, not recommended)

Every phase ends with `npm run lint` (exit 0) and `npm run build` (exit 0), under the environment block, plus its own
checks, and is committed on `feat/drafted-redesign`. Owner: builder, unless stated.

### P0 — Branch and baseline
Files: `design/drafted/**`, `frontend/package.json`, `frontend/package-lock.json`.
1. `git switch -c feat/drafted-redesign` from master → verify: `git branch --show-current` = `feat/drafted-redesign`.
2. Commit `design/drafted/` (incl. this plan) → verify: `git ls-files design/drafted | Measure-Object` = 9 files; `git status --porcelain` empty.
3. `npm i -D playwright-core`, commit → verify: `node -e "require.resolve('playwright-core')"` exit 0.
4. Baseline `npm run lint` + `npm run build` → verify: both exit 0. Record existing warnings as the baseline.

### P1 — Foundation
Files: `scripts/font-metrics.py`, `src/lib/font-metrics.ts`, `src/lib/tempo.ts`, `src/app/(site)/layout.tsx`, `globals.css`,
`src/styles/custom.css` (delete), `src/components/{site-chrome,construction,reveal,copy-button,markdown}.tsx`,
`src/app/(site)/page.tsx` (a placeholder; P3b builds the home), `scripts/verify-site.mjs`.
1. Generator → verify: `python scripts/font-metrics.py` prints the glyph count (9 incl. space), kern `K u = -21`, mono advance,
   label char count. A second run leaves `git diff --exit-code src/lib/font-metrics.ts` = 0 (deterministic).
2. Layout: fonts, boot script, skip link, grain, Header/Footer; `Providers`/`ScrollToTop`/`BottomNav` no longer imported (old files stay until P5).
   → verify: `curl.exe -s http://localhost:3000/ | Select-String "classList.add\('js'\)"` matches; no `class="dark"` in the HTML.
3. (Moved: the home and its name are P3b, §0.) Fonts include Caveat → verify: the `--font-hand` variable resolves on `<html>`.
4. Toggle + Guides + CursorReadout + Reveal + CopyButton + `markdown.tsx` (heading shift option, `slugify` ids from
   `lib/utils/generate-toc.ts`, `data-fact` wrapper, `pre` = plain code) → verify (harness): port `verify.mjs:316-337`
   (one ≥44 px button; Enter shows and Space hides; guides > 0; no font readouts; "l" key does nothing). Hovering `.process`
   draws guides with a numeric px label.
5. `verify-site.mjs` with contexts desktop-1440x900, 1920x905, 1024x768, phone-390x844@3x touch, reduced-motion, no-JS.
   Per route: no console/page errors, no horizontal overflow (**all** contexts), banned words (port `verify.mjs:31-66`, with
   attributes inside `[data-fact]` also skipped: gallery alts say "stage"), skip link first in tab order, `.btn,.toggle,.rowbtn,.nav-a,.foot a,.tb-link` ≥ 44 px tall.
Success: `node scripts/verify-site.mjs --routes /` → last line `VERIFY OK`, exit 0.

### P2 — Drawing system, schema, content
Files: `src/lib/drawing.ts`, `src/components/drawing-view.tsx`, `scripts/check-drawing.mts`, `src/payload/collections/Projects.ts`,
`src/migrations/20261013_000000_drafted_sheet_fields.ts`, `src/payload-types.ts`, `src/lib/cms/{index,types,fallback}.ts`,
`src/migration/case-studies/sheets.json`, the 4 case-study md files, `scripts/import-case-studies.ts`, `frontend/.gitignore`
(add `/scripts/backups/`).
1. `drawing.ts` + `check-drawing.mts` (node:assert, like the old check) → verify: `node_modules\.bin\tsx.cmd scripts/check-drawing.mts` → `check-drawing: all N assertions passed`. Asserts:
   the 4 drawings parse; 6+ invalid shapes return null; `describe()` equals the prototype `.dia-text` strings **exactly**
   (`drafted.html:450, 483, 516, 549`); for W ∈ {358, 524, 848, 1232} × {panel, sheet} options: 0 overlapping boxes, every
   text inside [0, W] (the `verify.mjs:207-219` rules), every edge's last point on its target box border, marks sorted so `end` = max(at+dur).
2. Fields + migration + `npm run generate:types` → verify: §3.3 test, all expected outputs; `payload-types.ts` contains `sheet?:` and `drawing?:`.
   Do not regenerate the importMap.
3. `lib/cms` (`toProject` adds `sheet` with `built/decisions` split on `\n`, and `drawing: parseDrawing(doc.drawing)`; sort: featured
   first, featured docs by `featured_order` asc (nulls last) then start_date desc; non-featured docs ignore `featured_order`, since old
   seeds left stale values, and sort by start_date desc, nulls last) + `fallback.ts` + `sheets.json` → verify: build passes.
4. Import script + md edits + dev load (§3.5a) → verify: the second dry-run prints `same` for every field of all 4 slugs,
   the featured order `b2b-wholesale-platform, staffing-operations-platform, esports-talent-portfolio, tredye-trading-platform`,
   and `flow fences: 0`.
Success: lint, build, check-drawing, migration test, idempotent import: all green.

### P3 — Projects index and sheets (the home is P3b, §0)
Files: `src/components/{works-index,sheet-figure,sheet-keys,gallery-video}.tsx`, `projects/page.tsx`,
`projects/[slug]/page.tsx`, `globals.css` (append), `scripts/verify-site.mjs` (extend). Delete `projects-client.tsx`,
`src/components/projects/*`, `src/components/sections/*`, `scripts/check-flow-diagram.mts`.
- Home: not in this phase (P3b, §0). `/projects` opens with sec-head "Index of works" and lab "4 sheets · each drawing is the
  real architecture", then `WorksIndex` with its key (`.needs-js`), then the earlier-works table.
- /projects = sec-head h1 + `WorksIndex` + `section#earlier`: `.idx` Year (`.sh`) | Project (`.rowbtn` link) | Kind (`.k`, category) | Stack (`.st`, 3 + "+N more").
- Sheet page = markup from `drafted.html:430-460` with h1 = `.sheet-title` (`id="t-<slug>" tabindex="-1"`). Plus: `.sheet-top`
  (static, not sticky) with a "← Back to index" link and lab "Sheet 01 of 04 · Esc"; title block rows Sheet / Project / For / Kind / Stack
  (+ Live ↗ when `live_url`); `tb-link` "Full case study ↓" → `#case-study`; figure = `SheetFigure` + `.dia-text`
  + `.fig-cap`; 4 `.blk` in `PenBlocks` (`data-fact` on the text); then `section#case-study` = `Markdown` (h1→h2 shift,
  `data-fact`) and `section.plates` (figure per gallery item, caption `<span class="lab">Fig. 02</span> <span data-fact>alt</span>`).
  Earlier works use the same page without the figure, blocks or Sheet row.
- Verify (harness): port `verify.mjs:262-315` (rows draft on hover, focus and tap; no row moves; inline panel on touch;
  `aria-label` starts "Architecture of <name>: "; panel heading is not live) on `/projects`. For each of the 4 sheets:
  heads = `Problem|What I built|Key decisions|Outcome`, each with ≥1 `.ln`; figure `data-state=inked`; geometry check;
  `SOURCE` phrases present (`verify.mjs:104-108`); banned words outside facts = none; all `.blk` reach `.is-in` after scrolling.
  Click from the index → focus on `#t-<slug>`; Esc → back at the index with the row in view. On a hard load Esc → `/projects`.
  No-JS: rows link to `/projects/<slug>`, every sheet shows its blocks and the SSR drawing, controls are hidden.
  One earlier-work page renders without a figure.
Success: `node scripts/verify-site.mjs --routes /projects,/projects/*` → `VERIFY OK`.

### P4 — Blog, About, Contact
Files: `src/app/(site)/blog/page.tsx`, `blog/[slug]/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `src/components/contact-form.tsx`,
`globals.css` (append), `scripts/verify-site.mjs` (extend). Delete `blog-page-client.tsx`, `src/components/{blog,about,forms}/*`.
**Split 2026-10-13 (parallel run):** the P4 builder does Blog and About in its own worktree while P3b builds the home.
`/contact` and the deletion of `src/components/forms/*` follow after P3b merges, because they need P3b's `ContactForm`.
Structures (prototype primitives only):
- **Blog index:** `.container.gv` → `.sec-head` (h1 `.t-h2` "Blog" `data-cons="text"`, lab "N posts · newest first") →
  `table.idx` (`caption.sr-only`): No. (`.sh` "01") | Title (`.rowbtn` link + `p.row-sub[data-fact]` excerpt) | Category (`.k`) | Date · read (`.st`, mono, `YYYY-MM-DD · 8 min`). No filter.
- **Blog article:** `.sheet-top` ("← Back to blog", lab "Post 01 of 03 · 8 min read") → `.sheet-grid`: `.sh-head` (lab category; h1
  `.sheet-title.sheet-title--long[data-fact]`; `.sheet-one[data-fact]` excerpt); `.tb` (dl: Post n/N, Published (mono), Reading,
  Category, Tags; `tb-link` "Contents ↓" on <960 px); `.fig.prose[data-fact]` = `Markdown`; `nav.toc.tb` (grid col 9/span 4,
  `position:sticky; top:76px` ≥960 px; h2/h3 links from `generateToc`) → share row (`CopyButton` "Copy link", LinkedIn ↗, X ↗ as plain
  anchors with absolute URLs from `NEXT_PUBLIC_SITE_URL`) → `.sec-head` "More posts" + 2-row `.idx`.
  Reading progress = `.progress` 2 px ink bar under the header, `animation: grow linear both; animation-timeline: scroll(root)`
  inside `@supports (animation-timeline: scroll())` (no JS; absent where unsupported).
- **About:** `.sheet-grid`: `.sh-head` (lab "About · <location>", h1 `.sheet-title` name, `.sheet-one` headline); `.tb` (Role,
  Based, Experience "10+ years", `tb-link` "Résumé ↗" → `resume_url`, new tab, sr-only "(opens in a new tab)").
  Bio = `.blk` "Bio" with `p.ln[data-fact]`. Experience = `.sec-head` + `.idx` Years (`.sh` mono "2026–now") | Role (+ `p.row-sub[data-fact]`
  description) | Organisation (`.k`, link if `company_url`) | Where (`.st`). Skills = `.blocks`: per group `.blk-h` + one `p[data-fact]` joined
  " · " (group names from the old `skills-grid.tsx:61` map). Education = `.idx`. Beyond code = `.sec-head` + `p[data-fact]` joined " · ", no icons.
  Keep the fallbacks: move `defaultAboutData` (`about/page.tsx:32-49`), the 8-entry experience fallback (`experience-timeline.tsx`) and the skills fallback into the page.
- **Contact:** `.sheet-grid`: `.sh-head` (lab "Contact", h1 `.sheet-title` "Get in touch", `.sheet-one` = existing copy `contact/page.tsx:41-42`);
  `.tb` (Based, Replies "usually within 24–48 hours", GitHub ↗, LinkedIn ↗); the shared `ContactForm` (D28; the same component as the home close, no `.needs-js`):
  the routed brief of §0 item 6. Its inputs carry `required minlength maxlength` and `type=email` per `contact-schema.ts` (text ≥ 16 px,
  44 px targets), each with `aria-describedby` → its row's `p.err`. Rajat's row is the submit button. A `p.lab[aria-live=polite]` status sits under the sheet ("Sending…" / "Sent. …" /
  "Not sent — <server message>. Please try again."). Server 400 `details` map onto field errors. Error text in `--ink` with a
  2 px `--deep-orange` mark: `--deep-orange` on `--lab` is ~4.3:1, too low for small text. Without JS the native POST plus
  the `303 #sent` / `#send-error` round trip shows the same status from the server-rendered page via `:target` (D28 refined). **No email anywhere** (D28).
  Verify: a grep of the built HTML of every route for `@outlook.com` → 0. The no-JS context submits the form and lands on `#sent`
  (with `page.route` intercepting the API, so no real email is sent).
- Verify (harness): every route clean in all contexts. `/contact` with `page.route('**/api/contact')`: 200 → status "Sent";
  400 with details → field error text plus `aria-invalid`; an empty submit is blocked natively (no request). No real email is ever sent.
  The TOC links scroll to existing ids. `/about` shows 8 experience rows.
Success: `node scripts/verify-site.mjs` (all routes so far) → `VERIFY OK`.

### P5 — Measurements, cleanup, full matrix, docs
Files: `package.json`/lock, deleted files per §4.1, `next.config.ts`, `scripts/measure-grain.mjs`, `scripts/verify-site.mjs`, `globals.css` (grain line), `CLAUDE.md`.
1. Delete per §4.1, `npm uninstall <list>` → verify:
   `Get-ChildItem src -Recurse -Include *.ts,*.tsx,*.css | Select-String -Pattern 'from "(motion|lenis|next-themes|lucide-react|sonner|react-hook-form|@hookform|@radix-ui|class-variance-authority|clsx|tailwind-merge)|tailwindcss|tw-animate'`
   → no matches. Also `Select-String` the `className=` strings under `src/app/(site)` and `src/components` for leftover Tailwind
   utilities (`inset-0`, `w-full`, `h-full`, `flex`, `grid`, `text-`, `bg-`, `rounded`, `aspect-`) → none: a dead utility class
   fails silently (`gallery-video.tsx` uses them today). Build passes. Check `/admin` under `next dev` only (HTTP 200, no page error): under `next start`, `.env.production.local`
   makes the production Blob and Resend keys live. Payload admin CSS must be untouched.
2. Grain (§4.7 Q6b) → verify: script prints a table for off / multiply / normal and the visual diff. The orchestrator applies the decision rule.
3. `node_modules\.bin\playwright-core.cmd install webkit` (≈70 MB download to `%LOCALAPPDATA%\ms-playwright`; network verified reachable)
   → add contexts tablet-768x1024 and tablet-1024x1366 (touch, DPR 2; inline panel expected for both) and webkit-1440x900, webkit-390x844 touch
   → full matrix → `VERIFY OK`.
4. No old design left (D27):
   - `src/app/(site)/not-found.tsx` in the sheet language ("Sheet not found", lab labels, a link to the site map).
   - The favicon (`icon.svg` + `favicon.ico`) and `apple-icon` redrawn as the orange square mark.
   - A new static `public/og-image.png` (1200×630): "Rajat." in the display face with the orange square, role in a mono label, on the lab ground. It is screenshotted once from an HTML template by `scripts/og-image.mjs` (playwright-core).

   Verify:
   - A grep for `Geist`, `lucide`, `@/components/ui`, `shadcn`, `dark:` and old class names over `src/` → none.
   - `/does-not-exist` renders the new 404, with the HTTP status still 404.
   - The new `og-image.png` hash differs from master's, and its first pixel row is the lab colour.
5. CLAUDE.md: stack (plain CSS `globals.css`, no Tailwind/shadcn/Framer/Lenis/dark mode; next/font Instrument Sans + Martian Mono + Caveat + Doto; three.js on the home only);
   content model (`sheet` group, `drawing` json, `featured_order` sorts featured); commands (`check-drawing`, `verify-site`, `measure-grain`,
   `font-metrics.py`, import flags `--content`); the `.env.production.local` caution. Replace the line "featured_order sorts nothing".
Success: §6 all green. Then the orchestrator runs the challenger gate on the full diff.

### P6 — Production rollout (Rajat runs or confirms each step; not a builder phase). See §7.

---

## 6. Verification matrix (P5 final; earlier phases run their subset)

| Check | Command | Pass |
|---|---|---|
| Lint | `npm run lint` | exit 0, no new warnings vs P0 baseline |
| Build | `npm run build` (env block; Node 24) | exit 0; `/projects/[slug]` lists 12 paths, `/blog/[slug]` 3 |
| Drawing invariants | `node_modules\.bin\tsx.cmd scripts/check-drawing.mts` | `all N assertions passed` |
| Migration from empty | §3.3 block | both migrations ran; A/B column lists identical; up re-run no-op; down exit 0 |
| Import idempotent | dry-run after execute | every field `same`, order 1-4, `flow fences: 0` |
| Browser matrix | `npm run build; npm run start` (background) then `node scripts/verify-site.mjs` | `VERIFY OK` |
| Contexts | desktop 1440x900, 1920x905, 1024x768 (mouse) · phone 390x844@3 touch · tablet 768x1024@2, 1024x1366@2 touch · reduced-motion 1440 · no-JS 1440 · WebKit 1440x900 + 390x844 touch | every check passes in every context |
| Routes | `/`, `/projects`, 4 sheets, 1 earlier work, `/blog`, 3 posts, `/about`, `/contact`, `/admin` (200 only, under `next dev`) | as per P1-P5 checks |
| Per route | console errors 0, page errors 0, `scrollWidth == clientWidth`, banned words 0 (facts + code skipped), skip link first, controls ≥44 px, reduced motion → no `intro-run` / `drafting` | all |
| Grain | `node scripts/measure-grain.mjs` | numbers + decision recorded in the P5 report |
| Screenshots | harness → `frontend/screenshots/` (gitignore it) | reviewed by the challenger against `drafted.html` |

---

## 7. Push / deploy policy

**Fact:** Preview and Production share `DATABASE_URL(_UNPOOLED)` and `BLOB_READ_WRITE_TOKEN`, and `npm run ci` runs `payload migrate`.
So **any pushed branch migrates the production DB** in its preview build, and its preview runtime reads (and, through
`/admin`, could write) production data.

Policy:
1. The branch stays local through P5. No `git push`, no PR, no Vercel action.
2. **P6, in order, each step with Rajat's explicit OK.** From P6a until 2d passes, make **no project edits in `/admin`**: an
   old-code save writes a version row with empty `sheet`/`drawing` (`@payloadcms/drizzle/dist/createVersion.js`), and the new
   admin starts from the latest version, so its next save would blank them.
   a. *Migrate prod (additive).* In a fresh PowerShell, set `$env:DATABASE_URI` to the production unpooled URL (Rajat supplies it;
      never echo it), run `payload.cmd migrate:status` (read-only: 20261013 pending) → OK → `payload.cmd migrate`. Old code ignores the new columns.
   b. *Content.* Also set `$env:BLOB_READ_WRITE_TOKEN` (the import's remote guard needs it; no uploads happen for existing slugs).
      `payload.cmd run scripts/import-case-studies.ts -- --content`: banner `REMOTE / production`, review the per-field diff.
      Any line listed as only in the current value is an admin edit that `--content` would overwrite: port it into the md
      first, or drop `--content` → OK → `… -- --content --execute` (old values of every changed field land in `scripts/backups/`). The old site keeps working; visible effect: Tredye appears as a 4th featured card and its old body diagram is gone.
   c. *Ship.* Push the branch, open the PR. Its preview build's migrate is now a no-op and it renders real content. Use it for the real-device
      Safari/iOS check. Merge to master. The production build reads complete content, so there is no degraded window.
   d. *Verify live:* `/`, the 4 sheets, `/blog`, `/about`, `/contact` load; Vercel runtime errors empty. The no-JS form path,
      without sending an email: a form-encoded POST to `/api/contact` with the honeypot `website` filled and the site's own
      `Origin` → 303 to `#sent`; the same with a foreign `Origin` → 303 to `#send-error`.
   e. *About copy (P5 review M1).* Production's About `bio_short`/`bio_full` and Site settings `site_description` still say
      "8+ years"; the code and fallbacks say "10+". Edit those three fields in the production `/admin` after 2d.
3. **Rollback:** Vercel instant rollback to the previous deployment. The DB changes are additive and old code ignores them. Old Tredye pages just
   lose the in-body diagram. After a rollback, and before any edit in the new admin, re-run the sync comparing against the
   latest version (`draft: true`), not the live row.
4. Optional hardening (Rajat decides; it changes the deploy script): make previews skip migrations:
   `"ci": "if [ \"$VERCEL_ENV\" = production ]; then DATABASE_URI=… payload migrate; fi && next build"`.
5. Never point `npm run dev` at prod (CLAUDE.md). Never open `/admin` on a preview.

---

## 8. Risks, non-goals, skipped

**Risks**
- R1 The layout port is the largest piece. It is bounded by check-drawing (exact `describe()` strings, geometry at 4 widths) and the harness geometry checks.
- R2 Playwright WebKit on Windows is not Safari (different rasteriser). Treat it as an engine-feature smoke test. The outlined hero removes the
  font-metric risk; the real iOS check happens on the P6c preview.
- R3 Headless Chrome uses software compositing (swiftshader), so the grain numbers are an upper-bound proxy, not phone truth.
- R4 The prod Blob token loads in local prod builds (`.env.production.local`). Mitigated by the "never /admin under next start" rule and the harness never uploading.
- R5 ISR: admin edits still take up to 1 h (unchanged).
- R6 Copy deviations: D-summary 3 and 4 (title block "For" wording; technologies order).
- R7 The intro's ink timeline runs from first paint. On very slow hydration the construction overlay joins late. It is fast-forwarded by elapsed time; the ink is never blocked.

**Non-goals:** dark theme; new copy beyond the home (the open copy questions stay open); category filters; newsletter; (OG image, favicon and a styled 404 are now IN scope, D27 / P5 step 4);
on-demand revalidation; View Transitions; the July Strapi reconciliation; sheet-page fallback when the DB is empty (still `notFound()`).

**Skipped (falsifiable triggers)**
- skipped: construction-mode persistence (localStorage), add when Rajat reports re-enabling it after each reload.
- skipped: dark theme, add when Rajat asks for a dark variant of Drafted.
- skipped: category filters on /projects and /blog, add when either list passes 12 entries.
- skipped: row→sheet expand transition, add when Next marks `experimental.viewTransition` stable.
- skipped: v1 ```` ```flow ```` compatibility, add when the import dry-run reports `flow fences > 0` on any published doc.
- skipped: Chromium kerning-parity check of the outlined name vs browser `<text>`, add when Rajat says the name differs from the prototype screenshot.
- skipped: CAPTCHA or Turnstile on the contact form (only the honeypot ships), add when more than 5 spam submissions arrive in a week.
- skipped: real low-end Android grain trace, add when the headless numbers fall within 10% of the decision threshold.
