#!/usr/bin/env node
/*
 * verify-site.mjs -- browser verification harness for the Drafted port.
 * Port of design/drafted/verify.mjs's approach (system Chrome via
 * playwright-core, no downloaded browsers) pointed at the real running app
 * instead of a single static prototype file.
 *
 * Usage (per BUILD-PLAN.md §5/§6): build and start the app yourself, then run
 * this against it and stop the server afterwards.
 *   npm run build
 *   npm run start                      # (background, port 3000)
 *   node scripts/verify-site.mjs --routes /
 *
 * Exit code 0 + "VERIFY OK" on success, 1 + "VERIFY FAIL" otherwise.
 */
import { chromium, webkit } from "playwright-core";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE_URL = process.env.VERIFY_BASE_URL || "http://localhost:3000";
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SCREENSHOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../screenshots");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const argv = process.argv.slice(2);
const routesIdx = argv.indexOf("--routes");
const routes = routesIdx >= 0 && argv[routesIdx + 1] ? argv[routesIdx + 1].split(",") : ["/"];

// P3: facts that were once reworded for the design copy; they must read as
// the case-study source does (design/drafted/verify.mjs:104-108).
const SOURCE = {
  "staffing-operations-platform": ["row-level security", "Row-Level Security"],
  "esports-talent-portfolio": ["stage host and broadcast voice", "a gallery from the stage", "proof of the stages already worked"],
  "tredye-trading-platform": ["Each stage runs in its own container", "a shared Docker build stage"],
};
const SHEET_HEADS = "Problem|What I built|Key decisions|Outcome";

// Same list as design/drafted/verify.mjs: polices design copy/UI chrome
// against leaking the metal/gaming vocabulary the site's visual language
// draws from, never real project content. [data-fact] (real facts: gallery
// alts say "stage", for instance) and <code> are skipped.
const BANNED_WORDS = [
  "overdrive", "gain", "signal", "oscilloscope", "hud", "slam", "loadout", "riff", "amp",
  "metal", "level", "hp", "guitar", "chord", "stage", "boss", "quest", "loot", "respawn",
  "headshot", "combo", "score", "track", "album", "band", "mixtape",
];
const bannedRegex = new RegExp("\\b(" + BANNED_WORDS.join("|") + ")s?\\b", "i");
const WHITELIST = /row-level/gi;

const CONTEXTS = [
  ["desktop-1440x900", { viewport: { width: 1440, height: 900 } }],
  ["desktop-1920x905", { viewport: { width: 1920, height: 905 } }],
  ["desktop-1024x768", { viewport: { width: 1024, height: 768 } }],
  ["phone-390x844", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
  ["reduced-motion", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }],
  ["no-js", { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }],
  // §4.7 Q6d: both fall under the inline-panel query, so the checks are the phone's.
  ["tablet-768x1024", { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ["tablet-1024x1366", { viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  // P5 step 3: WebKit — engine-feature smoke test, not real Safari (R2).
  ["webkit-1440x900", { viewport: { width: 1440, height: 900 }, browserName: "webkit" }],
  ["webkit-390x844", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, browserName: "webkit" }],
];

async function bannedHit(page) {
  const { text, codeTexts, attrs } = await page.evaluate(() => {
    const st = document.createElement("style");
    st.textContent = "[data-fact]{display:none!important}";
    document.head.appendChild(st);
    const text = document.body.innerText || "";
    const codeTexts = Array.from(document.querySelectorAll("code")).map((c) => c.innerText || c.textContent || "");
    st.remove();
    const list = [];
    document.querySelectorAll("[aria-label],[title],[alt]").forEach((el) => {
      if (el.closest("code") || el.closest("[data-fact]")) return;
      ["aria-label", "title", "alt"].forEach((a) => {
        const v = el.getAttribute(a);
        if (v) list.push(v);
      });
    });
    return { text, codeTexts, attrs: list.join("\n") };
  });
  let t = text;
  for (const ct of codeTexts) if (ct) t = t.split(ct).join("");
  const m = (t + "\n" + attrs).replace(WHITELIST, " ").match(bannedRegex);
  return m ? m[0] : null;
}

async function checkRoute(page, routePath, contextName) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); };
  // WebKit reports the Next prefetches it cancels when a page is left mid-flight as "…?_rsc=… due to access
  // control checks" (reproduced by holding _rsc responses and navigating). They come from the page being left.
  const onPageError = (err) => { if (!/\?_rsc=\S+ due to access control checks/.test(err.message)) pageErrors.push(err.message); };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.goto(BASE_URL + routePath, { waitUntil: "load" });
  await page.waitForTimeout(300);

  // P5 step 8: one screenshot per route/context, for the challenger review.
  if (contextName) {
    const safeRoute = routePath === "/" ? "home" : routePath.replace(/\//g, "_");
    await page
      .screenshot({ path: path.join(SCREENSHOT_DIR, `${contextName}${safeRoute}.png`) })
      .catch(() => {});
  }

  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? ": " + consoleErrors.join(" | ") : ""}`);
  check(pageErrors.length === 0, `no page errors${pageErrors.length ? ": " + pageErrors.join(" | ") : ""}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `no horizontal overflow (scrollWidth - clientWidth = ${overflow})`);

  const hit = await bannedHit(page);
  check(!hit, `no banned words${hit ? `: "${hit}"` : ""}`);

  // WebKit, like Safari, leaves links out of the Tab order (only macOS's Option+Tab or a setting brings them
  // back), so there the check is structural: the skip link is the first focusable element in the document.
  const webkit = page.context().browser()?.browserType().name() === "webkit";
  let first;
  if (webkit) {
    first = await page.evaluate(
      () =>
        document.querySelector("a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])")
          ?.className ?? ""
    );
  } else {
    await page.keyboard.press("Tab");
    first = await page.evaluate(() => document.activeElement?.className ?? "");
  }
  check(first.includes("skip"), `skip link is first in tab order (${webkit ? "first focusable" : "focused"} className: "${first}")`);

  const sizes = await page.evaluate(() => {
    const els = document.querySelectorAll(".btn,.toggle,.rowbtn,.nav-a,.foot a,.tb-link");
    return Array.from(els)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { h: r.height, visible: r.width > 0 && r.height > 0, text: (el.textContent || "").trim().slice(0, 24) };
      })
      .filter((s) => s.visible);
  });
  const short = sizes.filter((s) => s.h < 44);
  check(
    short.length === 0,
    `all ${sizes.length} controls are >=44px tall${short.length ? ` (short: ${short.map((s) => `${s.text}@${Math.round(s.h)}`).join(", ")})` : ""}`
  );

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return out;
}

// Port of design/drafted/verify.mjs:316-337: one plain, keyboard-operable
// construction toggle, with guides it draws and clears.
async function checkConstruction(page, touch) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  const btn = page.locator("#consBtn");
  const bb = await btn.boundingBox();
  const label0 = await page.locator("#consBtn .tg-label").textContent();
  check(
    !!bb && bb.height >= 44 && label0 === "Show construction",
    `"Show construction" is one >=44px button (${bb ? `${Math.round(bb.width)}x${Math.round(bb.height)}` : "none"})`
  );

  if (touch) await btn.tap();
  else {
    await btn.focus();
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(300);
  const guidesOnCount = await page.locator("#guides path").count();
  const labelOn = await page.locator("#consBtn .tg-label").textContent();
  const constructionOn = await page.evaluate(() => document.documentElement.dataset.construction === "on");
  check(
    constructionOn && guidesOnCount > 0 && labelOn === "Hide construction",
    `${touch ? "tap" : "Enter"} shows construction (${guidesOnCount} guide paths, label "${labelOn}")`
  );

  const readouts = await page.evaluate(() => document.getElementById("guides")?.textContent ?? "");
  check(!/Instrument|Martian|wght|wdth/i.test(readouts), "construction shows drafting only: no font-spec readouts");

  await page.keyboard.press("l");
  await page.waitForTimeout(150);
  const stillOn = await page.evaluate(() => document.documentElement.dataset.construction === "on");
  check(stillOn, 'pressing "l" changes nothing (no single-key shortcut)');

  if (touch) await btn.tap();
  else await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  const guidesOffCount = await page.locator("#guides path").count();
  const labelOff = await page.locator("#consBtn .tg-label").textContent();
  const constructionOff = await page.evaluate(() => document.documentElement.dataset.construction !== "on");
  check(
    constructionOff && guidesOffCount === 0 && labelOff === "Show construction",
    `${touch ? "tap" : "Space"} hides construction again (${guidesOffCount} guide paths, label "${labelOff}")`
  );

  if (!touch) {
    const target = page.locator("[data-cons]").first();
    await target.scrollIntoViewIfNeeded(); // P3b: the home stage pushes the first [data-cons] far below the fold
    const box = await target.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
      const hoverLabel = await page.evaluate(() => document.querySelector("#guides text.c-txt")?.textContent ?? null);
      check(!!hoverLabel && /^\d+$/.test(hoverLabel), `hovering a [data-cons] element draws guides with a numeric px label ("${hoverLabel}")`);
      await page.mouse.move(5, 5);
    } else {
      check(false, "no [data-cons] element found to hover");
    }
  }

  return out;
}

// P3: resolve "/projects/*" into the real featured-sheet and earlier-work
// routes by reading the live index, instead of hardcoding slugs.
async function resolveProjectRoutes(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + "/projects", { waitUntil: "load" });
  const { featured, earlier } = await page.evaluate(() => ({
    featured: [...document.querySelectorAll("#rows .rowbtn")].map((a) => a.getAttribute("href")),
    earlier: [...document.querySelectorAll("#earlier .rowbtn")].map((a) => a.getAttribute("href")),
  }));
  await ctx.close();
  return { featured, earlierOne: earlier[0] ?? null };
}

// Port of design/drafted/verify.mjs:262-315's works-index section, adapted to
// WorksIndex's real route per-row links (D1) instead of the SPA inspect modal.
async function checkWorksIndex(page, touch) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  const drafted = (slug) =>
    page
      .waitForFunction(
        (s) => {
          const el = document.querySelector(".panel .dia");
          return !!el && el.dataset.project === s && el.dataset.state === "inked";
        },
        slug,
        { timeout: 8000 }
      )
      .then(() => true, () => false);
  const row = (i) => page.locator("#rows tr.prow").nth(i);
  const rowTops = () =>
    page.evaluate(() => [...document.querySelectorAll("#rows tr.prow")].map((r) => Math.round((r.getBoundingClientRect().top + scrollY) * 2) / 2));

  await page.goto(BASE_URL + "/projects", { waitUntil: "load" });
  await page.locator("#works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const rowCount = await page.locator("#rows tr.prow").count();
  for (let i = 0; i < rowCount; i++) {
    const slug = (await row(i).locator(".rowbtn").getAttribute("href")).replace("/projects/", "");
    if (touch) {
      await row(i).locator("td.sh").tap();
    } else {
      await row(i).scrollIntoViewIfNeeded();
      const before = await rowTops();
      const bb = await row(i).boundingBox();
      await page.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height / 2);
      await drafted(slug);
      const after = await rowTops();
      const moved = before.map((t, k) => Math.abs(t - after[k])).reduce((a, b) => Math.max(a, b), 0);
      check(moved === 0, `hover row ${i + 1}: no row moves (largest shift ${moved} px)`);
    }
    const ok = await drafted(slug);
    check(ok, `${touch ? "tap" : "hover"} row ${i + 1} drafts ${slug} (state ${ok ? "inked" : "NOT inked within 8 s"})`);
    const lab = await page.evaluate(() => ({
      label: document.querySelector(".panel .dia")?.getAttribute("aria-label") || "",
      live: document.getElementById("panel-h")?.getAttribute("aria-live"),
    }));
    const name = (await row(i).locator(".rowbtn").textContent()) ?? "";
    check(
      lab.label.startsWith(`Architecture of ${name}: `) && !lab.live,
      `${slug} panel drawing is labelled "${lab.label.slice(0, 44)}…"; its heading is not a live region`
    );
    if (touch) {
      // the panel scrolls into view on the frame after the tap (bringPanelIntoView); WebKit's tap() returns before
      // that frame, Chromium's after it, so give it two frames before measuring
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const inl = await page.evaluate((k) => {
        const rows = [...document.querySelectorAll("#rows tr.prow")];
        const panel = document.querySelector(".panel");
        const tr = panel?.closest("tr");
        const p = panel.getBoundingClientRect();
        return { after: !!tr && tr.previousElementSibling === rows[k], top: Math.round(p.top), bottom: Math.round(p.bottom), vh: innerHeight };
      }, i);
      check(inl.after, `tap row ${i + 1}: the drawing sits inline under the row (panel-row)`);
      check(inl.top >= 0 && inl.bottom <= inl.vh + 200, `tap row ${i + 1}: the drawing is in view (top ${inl.top}, bottom ${inl.bottom} of ${inl.vh})`);
    }
  }
  if (!touch) {
    await row(2).locator(".rowbtn").focus();
    const slug = (await row(2).locator(".rowbtn").getAttribute("href")).replace("/projects/", "");
    check(await drafted(slug), "keyboard focus on a row drafts its architecture");
  }
  return out;
}

async function geometry(page, sel) {
  return page.evaluate((s) => {
    const svg = document.querySelector(s);
    const W = +svg.getAttribute("width");
    const bx = [...svg.querySelectorAll("path.d-box")].map((p) => p.getBBox());
    let overlap = 0;
    for (let i = 0; i < bx.length; i++) {
      for (let j = i + 1; j < bx.length; j++) {
        const a = bx[i];
        const b = bx[j];
        if (a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1) overlap++;
      }
    }
    const out = [...svg.querySelectorAll("text")]
      .filter((t) => {
        const b = t.getBBox();
        return b.x < -0.5 || b.x + b.width > W + 0.5;
      })
      .map((t) => t.textContent);
    return { overlap, out };
  }, sel);
}

// P3: each of the 4 featured sheets — heads, figure, geometry, source wording, block reveal.
async function checkSheet(page, slug) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  await page.goto(`${BASE_URL}/projects/${slug}`, { waitUntil: "load" });

  const heads = await page.evaluate(() => [...document.querySelectorAll(".blk-h")].map((h) => h.textContent).join("|"));
  check(heads === SHEET_HEADS, `block heads are exactly "${SHEET_HEADS}" (got "${heads}")`);
  const lineCounts = await page.evaluate(() => [...document.querySelectorAll(".blk")].map((b) => b.querySelectorAll(".ln").length));
  check(lineCounts.every((n) => n >= 1), `every block has >=1 .ln (${lineCounts.join(",")})`);

  const inked = await page
    .waitForFunction(() => document.querySelector(".fig .dia")?.dataset.state === "inked", null, { timeout: 8000 })
    .then(() => true, () => false);
  check(inked, "figure reaches data-state=inked");

  const g = await geometry(page, ".fig .dia");
  check(g.overlap === 0 && g.out.length === 0, `figure geometry: no overlapping parts, every label inside the drawing${g.out.length ? "; outside: " + g.out.join(" | ") : ""}`);

  const source = SOURCE[slug];
  if (source) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    const missing = source.filter((phrase) => !bodyText.includes(phrase));
    check(missing.length === 0, `SOURCE phrases present${missing.length ? "; missing: " + missing.join(" | ") : ""}`);
  }

  const blocks = page.locator(".blk");
  const n = await blocks.count();
  for (let i = 0; i < n; i++) await blocks.nth(i).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const inCount = await page.locator(".blk.is-in").count();
  check(inCount === n, `every .blk reaches .is-in after scrolling (${inCount}/${n})`);

  return out;
}

// P3: an earlier work's page — the same page, without a figure.
async function checkEarlierNoFigure(page, slug) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  await page.goto(`${BASE_URL}/projects/${slug}`, { waitUntil: "load" });
  const hasFig = await page.evaluate(() => !!document.querySelector(".fig"));
  check(!hasFig, "earlier-work page renders without a figure");
  return out;
}

// P3: no-JS fallback — rows link, sheets carry their blocks and SSR drawing, controls are hidden.
async function checkNoJsProjects(page) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  await page.goto(BASE_URL + "/projects", { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const vis = (el) => !!el && el.getClientRects().length > 0;
    return {
      rowLinks: [...document.querySelectorAll("#rows .rowbtn")].map((a) => a.getAttribute("href")),
      toolsHidden: ["#consBtn", ".panel", ".key"].every((sel) => !vis(document.querySelector(sel))),
    };
  });
  check(r.rowLinks.length >= 4 && r.rowLinks.every(Boolean), `rows are links (${r.rowLinks.length})`);
  check(r.toolsHidden, "JS-only controls (toggle, panel, key) are hidden without JS");
  return out;
}

async function checkNoJsSheet(page, slug) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  await page.goto(`${BASE_URL}/projects/${slug}`, { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const vis = (el) => !!el && el.getClientRects().length > 0;
    const dia = document.querySelector(".fig .dia");
    return {
      figureVisible: vis(dia),
      pathCount: dia ? dia.querySelectorAll("path").length : 0,
      lineCount: document.querySelectorAll(".blk .ln").length,
    };
  });
  check(r.figureVisible && r.pathCount > 0, `the SSR drawing shows without JS (${r.pathCount} paths)`);
  check(r.lineCount >= 4, `the sheet shows its blocks without JS (${r.lineCount} lines)`);
  return out;
}

// P3: click-through from the index focuses the sheet title, and Esc returns
// to the index (with the row in view) after a click, or to /projects on a
// hard load. Run once, independent of the context matrix.
async function checkSheetNavigation(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE_URL + "/projects", { waitUntil: "load" });
  const firstHref = await page.locator("#rows .rowbtn").first().getAttribute("href");
  const slug = firstHref.replace("/projects/", "");
  await page.locator("#rows .rowbtn").first().click();
  await page.waitForURL(`**${firstHref}`);
  const focused = await page.evaluate((s) => document.activeElement?.id === `t-${s}`, slug);
  check(focused, `clicking a row from the index focuses #t-${slug}`);

  await page.keyboard.press("Escape");
  await page.waitForURL("**/projects");
  const rowInView = await page.evaluate(() => {
    const r = document.querySelector("#rows .rowbtn")?.getBoundingClientRect();
    return !!r && r.top >= 0 && r.top <= innerHeight;
  });
  check(page.url().endsWith("/projects"), "Esc after a click-through returns to /projects");
  check(rowInView, "the clicked row is back in view after Esc");

  await page.goto(`${BASE_URL}/projects/${slug}`, { waitUntil: "load" });
  await page.keyboard.press("Escape");
  await page.waitForURL("**/projects");
  check(page.url().endsWith("/projects"), "Esc on a hard-loaded sheet goes to /projects");

  await ctx.close();
  return out;
}

// ======================= P4: blog + about (BUILD-PLAN.md §5 "P4 — Blog, About, Contact") =======================

// P4: "/blog/*" expands to the live post routes, read once from the running
// app's index (same approach as resolveProjectRoutes).
async function resolveBlogRoutes(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + "/blog", { waitUntil: "load" });
  const posts = await page.evaluate(() => [...document.querySelectorAll("#blog .rowbtn")].map((a) => a.getAttribute("href")));
  await ctx.close();
  return posts;
}

// P4: a blog article — its TOC links all scroll to ids that really exist in
// the body, the reading-progress bar is driven by CSS alone (no JS), and the
// share links are absolute URLs (so they still work once copied off-site).
// None of this depends on JS, so it runs the same way in every context.
async function checkBlogArticle(page, routePath) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  await page.goto(BASE_URL + routePath, { waitUntil: "load" });

  const toc = await page.evaluate(() =>
    [...document.querySelectorAll(".toc a")].map((a) => {
      const href = a.getAttribute("href") || "";
      return { href, exists: href.startsWith("#") && !!document.getElementById(href.slice(1)) };
    })
  );
  const missingToc = toc.filter((t) => !t.exists);
  check(toc.length > 0, `TOC has >=1 entry (${toc.length})`);
  check(missingToc.length === 0, `every TOC link scrolls to an existing id${missingToc.length ? "; missing: " + missingToc.map((t) => t.href).join(", ") : ""}`);

  const progress = await page.evaluate(() => {
    const el = document.querySelector(".progress");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { animationName: cs.animationName, timeline: cs.animationTimeline || null };
  });
  check(!!progress, "a .progress element is server-rendered (no JS needed to create it)");
  check(
    !progress || progress.animationName === "none" || progress.animationName === "grow",
    `reading progress has no script-driven animation name (got "${progress?.animationName}")`
  );

  const shareHrefs = await page.evaluate(() => [...document.querySelectorAll(".share a")].map((a) => a.getAttribute("href") || ""));
  check(shareHrefs.length >= 2, `share row has >=2 links (${shareHrefs.length})`);
  check(
    shareHrefs.length > 0 && shareHrefs.every((h) => /^https?:\/\//.test(h)),
    `every share link is an absolute URL (${shareHrefs.join(", ") || "none"})`
  );

  return out;
}

// P4: /about shows exactly 8 experience rows (dev-seeded content and the
// fallback both carry 8).
async function checkAbout(page) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  await page.goto(BASE_URL + "/about", { waitUntil: "load" });
  const expRows = await page.evaluate(() => document.querySelectorAll('section[aria-labelledby="exp-h"] tr.prow').length);
  check(expRows === 8, `/about shows 8 experience rows (got ${expRows})`);
  return out;
}

// ========================================================================
// P3b home block (BUILD-PLAN.md §0 "P3b"): the shard stage + the routed
// contact brief. Self-contained -- every check below opens its own
// context/page so it can attach network/console listeners before
// navigating, independent of the shared per-context loop in main(). Kept in
// its own functions/section so it is easy to merge with any other builder's
// extension of this file.
// ========================================================================

const CHIP_FIXTURE = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Internal tools",
  message: "We need an internal tool to replace our spreadsheet workflow.",
};

async function fillBrief(page, data) {
  await page.fill("#cform input[name=name]", data.name);
  await page.fill("#cform input[name=email]", data.email);
  await page.check(`#cform input[name=subject][value="${data.subject}"]`);
  await page.fill("#cform textarea[name=message]", data.message);
}

// Chunk requests fired strictly after `load`, filtered to ones whose body
// contains a string unique to the three.js bundle -- robust to hashed chunk
// filenames and to Next's own unrelated <Link> route-prefetch chunks.
async function threeChunksAfterLoad(page, routePath) {
  const matches = [];
  let loaded = false;
  const onReq = async (req) => {
    if (!loaded || !/_next\/static\/chunks\/.+\.js(\?|$)/.test(req.url())) return;
    try {
      const res = await req.response();
      const body = res ? await res.text() : "";
      if (body.includes("WebGLRenderer")) matches.push(req.url());
    } catch {
      // the response can race the test's own teardown -- not a finding either way
    }
  };
  page.on("request", onReq);
  await page.goto(BASE_URL + routePath, { waitUntil: "load" });
  loaded = true;
  await page.waitForTimeout(1500);
  page.off("request", onReq);
  return matches;
}

async function withNoWebGL(browser, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const proto = HTMLCanvasElement.prototype;
    const orig = proto.getContext;
    proto.getContext = function (type, ...args) {
      if (typeof type === "string" && type.toLowerCase().includes("webgl")) return null;
      return orig.apply(this, [type, ...args]);
    };
  });
  const page = await ctx.newPage();
  try {
    return await fn(page);
  } finally {
    await ctx.close();
  }
}

// P3b step 2/3: no-JS shows every section with no canvas and no three
// request; reduced-motion and no-WebGL make no three request either; the
// default context does, after `load`.
async function checkStageLazyLoad(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  const noJsCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const noJsPage = await noJsCtx.newPage();
  await noJsPage.goto(BASE_URL + "/", { waitUntil: "load" });
  const noJs = await noJsPage.evaluate(() => ({
    canvas: !!document.querySelector(".exp-canvas"),
    sections: ["#who", "#build", "#map", "#contact"].every((s) => !!document.querySelector(s)),
  }));
  check(!noJs.canvas, "no-JS renders no <canvas>");
  check(noJs.sections, "no-JS renders every section (who/build/map/contact)");
  const noJsChunks = await (async () => {
    const chunks = [];
    noJsPage.on("response", async (res) => {
      if (!/_next\/static\/chunks\/.+\.js(\?|$)/.test(res.url())) return;
      try {
        if ((await res.text()).includes("WebGLRenderer")) chunks.push(res.url());
      } catch {
        /* ignore */
      }
    });
    await noJsPage.reload({ waitUntil: "load" });
    await noJsPage.waitForTimeout(1000);
    return chunks;
  })();
  check(noJsChunks.length === 0, `no-JS requests no three chunk (${noJsChunks.length})`);
  await noJsCtx.close();

  const defaultCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const defaultPage = await defaultCtx.newPage();
  const defaultChunks = await threeChunksAfterLoad(defaultPage, "/");
  check(defaultChunks.length > 0, `the default context requests the three chunk after load (${defaultChunks.length})`);
  await defaultCtx.close();

  const reducedCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const reducedPage = await reducedCtx.newPage();
  const reducedChunks = await threeChunksAfterLoad(reducedPage, "/");
  check(reducedChunks.length === 0, `reduced-motion requests no three chunk (${reducedChunks.length})`);
  await reducedCtx.close();

  const noWebglChunks = await withNoWebGL(browser, (page) => threeChunksAfterLoad(page, "/"));
  check(noWebglChunks.length === 0, `--disable-webgl requests no three chunk (${noWebglChunks.length})`);

  return out;
}

// P3b step 4: Enter locks the stage within 1.5s; HUD reads "Aligned · 0.0°".
async function checkStageLock(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  await page
    .waitForFunction(() => document.getElementById("exp")?.classList.contains("gl-ready"), null, { timeout: 8000 })
    .catch(() => {});
  await page.locator(".exp-pin").focus();
  await page.keyboard.press("Enter");
  const locked = await page
    .waitForFunction(() => document.getElementById("exp")?.dataset.locked !== undefined, null, { timeout: 1500 })
    .then(() => true, () => false);
  check(locked, "Enter locks the stage ([data-locked]) within 1.5s");
  const hud2 = await page.evaluate(() => document.getElementById("hudRow2")?.textContent ?? "");
  check(hud2 === "Aligned · 0.0°", `HUD reads "Aligned · 0.0°" (got "${hud2}")`);
  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? ": " + consoleErrors.join(" | ") : ""}`);
  await ctx.close();
  return out;
}

// P3b step 4: touch -- a sideways drag changes Turn; vertical scroll still scrolls.
async function checkStageTouch(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  await page
    .waitForFunction(() => document.getElementById("exp")?.classList.contains("gl-ready"), null, { timeout: 8000 })
    .catch(() => {});
  const before = await page.evaluate(() => document.getElementById("hudRow1")?.textContent ?? "");
  const box = await page.locator(".exp-canvas").boundingBox();
  if (box) {
    const client = await ctx.newCDPSession(page);
    const y = box.y + box.height / 2;
    const x0 = box.x + box.width * 0.75;
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
    for (let i = 1; i <= 6; i++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 - i * 20, y }] });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.getElementById("hudRow1")?.textContent ?? "");
  check(!!box, "the canvas has a bounding box to drag");
  check(before !== after, `a sideways drag changes the Turn readout ("${before}" -> "${after}")`);

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  const scrollAfter = await page.evaluate(() => window.scrollY);
  check(scrollAfter > scrollBefore, `vertical scroll still scrolls (${scrollBefore} -> ${scrollAfter})`);
  await ctx.close();
  return out;
}

// P3b step 5: data-step is 1/2/3 at scroll fractions .2/.5/.85 of the stage
// runway; at step 3 the sr-only lists expose every fix (the verifiable text
// stand-in for the canvas-drawn cards).
async function checkStageScrollStep(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  await page
    .waitForFunction(() => document.getElementById("exp")?.classList.contains("gl-ready"), null, { timeout: 8000 })
    .catch(() => {});

  for (const [frac, want] of [[0.2, "1"], [0.5, "2"], [0.85, "3"]]) {
    await page.evaluate((f) => {
      const exp = document.getElementById("exp");
      const pin = exp.querySelector(".exp-pin");
      const topH = document.querySelector(".top").getBoundingClientRect().height;
      const run = exp.offsetHeight - pin.offsetHeight;
      const rectTop = exp.getBoundingClientRect().top;
      const docTop = rectTop + window.scrollY;
      window.scrollTo(0, docTop - topH + run * f);
    }, frac);
    await page.waitForTimeout(500);
    const step = await page.evaluate(() => document.getElementById("exp")?.dataset.step);
    check(step === want, `scroll fraction ${frac}: data-step = ${want} (got ${step})`);
  }

  const fixesText = await page.evaluate(() => document.querySelector('.cap[data-step="3"] .sr-only')?.textContent ?? "");
  const fixes = [
    "Orders tracked end to end",
    "Live stock, one source",
    "A site your team edits",
    "One login, the right access",
    "Reports that build themselves",
    "Data entered once",
  ];
  const missing = fixes.filter((f) => !fixesText.includes(f));
  check(missing.length === 0, `step 3 exposes every fix${missing.length ? "; missing: " + missing.join(" | ") : ""}`);
  await ctx.close();
  return out;
}

// P3b step 5: at 390px no step/section label overflows its box.
async function checkHomeOverflow390(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  const overflowing = await page.evaluate(() => {
    const sels = ".cap-t,.lead,.node-t,.blk-h,.way-t,.end-t";
    return [...document.querySelectorAll(sels)]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.className + ": " + (el.textContent || "").slice(0, 30));
  });
  check(overflowing.length === 0, `no label overflows at 390px${overflowing.length ? "; " + overflowing.join(" | ") : ""}`);
  await ctx.close();
  return out;
}

// JS requested before the load event, as transferred (gzip). The stage imports three from its load handler, so
// the three chunk is left out by timing (sniffing for "WebGLRenderer" also matched the home's own route chunk).
async function jsBytesAtLoad(page) {
  return page.evaluate(() => {
    const load = performance.getEntriesByType("navigation")[0].loadEventStart;
    return performance
      .getEntriesByType("resource")
      .filter((e) => /\.js(\?|$)/.test(e.name) && e.startTime < load)
      .reduce((n, e) => n + (e.transferSize || 0), 0);
  });
}

// P3b step 6 / P5 step 3: home JS before interaction <=35KB over /about's, excluding
// the three chunk; LCP is the NameMark SVG; frame p95 while scrubbing at 4x CPU <= 25ms.
// `browser` here is the GPU-launched instance (see main()), not the swiftshader
// one used for the rest of the matrix: the frame-time number is only meaningful
// on real hardware compositing (§4.7/R3 calls swiftshader numbers an upper bound,
// not a gate).
async function checkHomePerf(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const client = await ctx.newCDPSession(page);

  const renderer = await page.evaluate(() => {
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
    } catch {
      return "unknown";
    }
  });
  console.log(`[home perf] WebGL renderer: ${renderer}`);

  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  const jsBytes = await jsBytesAtLoad(page);

  // The plan's flat 120KB budget is below the framework floor: React 19 + the Next 16 runtime ship on every
  // route. So the gate is what the home adds over /about, a page with no client code of its own beyond the
  // shared layout (BUILD-PLAN §0 P3b step 6).
  const aboutCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const aboutPage = await aboutCtx.newPage();
  await aboutPage.goto(BASE_URL + "/about", { waitUntil: "load" });
  const aboutBytes = await jsBytesAtLoad(aboutPage);
  await aboutCtx.close();
  const kb = (n) => (n / 1024).toFixed(1);
  check(
    jsBytes - aboutBytes <= 35 * 1024,
    `home JS before interaction is <= 35KB over /about's, excluding the three chunk (home ${kb(jsBytes)}KB, /about ${kb(aboutBytes)}KB, +${kb(jsBytes - aboutBytes)}KB)`
  );

  const lcp = await page.evaluate(
    () =>
      new Promise((resolve) => {
        try {
          new PerformanceObserver((list) => {
            const last = list.getEntries().at(-1);
            const el = last && last.element;
            resolve({ inNameMark: !!(el && el.closest && el.closest(".fallback-name")) });
          }).observe({ type: "largest-contentful-paint", buffered: true });
        } catch {
          resolve({ inNameMark: false });
        }
        setTimeout(() => resolve({ inNameMark: false }), 3000);
      })
  );
  check(lcp.inNameMark, "the LCP element is the NameMark SVG");

  await page
    .waitForFunction(() => document.getElementById("exp")?.classList.contains("gl-ready"), null, { timeout: 8000 })
    .catch(() => {});
  const deltas = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const ds = [];
        let last = performance.now();
        let n = 0;
        function step() {
          const now = performance.now();
          if (n > 0) ds.push(now - last);
          last = now;
          window.scrollBy(0, 8);
          n++;
          if (n < 180) requestAnimationFrame(step);
          else resolve(ds);
        }
        requestAnimationFrame(step);
      })
  );
  const sorted = deltas.slice().sort((a, b) => a - b);
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  check(p95 <= 25, `frame p95 while scrubbing at 4x CPU <= 25ms (got ${p95.toFixed(1)}ms, n=${sorted.length})`);

  await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await ctx.close();
  return out;
}

// Contact: fill -> armed; a 2xx shows the receipt and focuses it.
// ALWAYS intercepts /api/contact.
async function checkContactArmedAndSent(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "ok" }) })
  );
  await page.goto(BASE_URL + "/#contact", { waitUntil: "load" });
  await fillBrief(page, CHIP_FIXTURE);
  await page.waitForTimeout(150);
  const armed = await page.evaluate(() => document.getElementById("cform")?.classList.contains("armed"));
  check(armed, "filling all four parts arms the brief");

  await page.click(".brief-send");
  // The success path waits out the in-flight beat, inks Rajat's row, shatters
  // the form, then assembles the receipt -- several seconds of animation
  // (skipped only under reduced motion), so both waits below are generous.
  const shown = await page
    .waitForFunction(
      () => {
        const el = document.getElementById("sent");
        return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
      },
      null,
      { timeout: 8000 }
    )
    .then(() => true, () => false);
  check(shown, "a 2xx response shows the receipt");
  const focused = await page
    .waitForFunction(() => document.activeElement?.id === "sent", null, { timeout: 2000 })
    .then(() => true, () => false);
  check(focused, "focus moves to the receipt once it has assembled");
  await ctx.close();
  return out;
}

// Contact: a 400 with details shows a per-row field error + aria-invalid,
// and the status line explains it. ALWAYS intercepts /api/contact.
async function checkContactFieldError(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "Validation failed", details: { email: ["Please enter a valid email address"] } }),
    })
  );
  await page.goto(BASE_URL + "/#contact", { waitUntil: "load" });
  await fillBrief(page, CHIP_FIXTURE);
  await page.click(".brief-send");
  await page.waitForTimeout(500);

  const email = page.locator("#cform input[name=email]");
  check((await email.getAttribute("aria-invalid")) === "true", "a 400 with details marks the field aria-invalid");
  const errText = await page
    .locator('#cform .brief-row[data-f="email"] .err')
    .textContent()
    .catch(() => null);
  check(errText === "Please enter a valid email address", `the row shows the server's field error (got "${errText}")`);
  const status = await page.locator("[data-contact-status]").textContent();
  check(/^Not sent:/.test(status || ""), `the status line explains the failure (got "${status}")`);
  await ctx.close();
  return out;
}

// Contact: an empty submit never reaches the server (native required/type
// validation blocks it client-side). ALWAYS intercepts /api/contact.
async function checkContactEmptySubmitBlocked(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let posted = false;
  await page.route("**/api/contact", (route) => {
    posted = true;
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto(BASE_URL + "/#contact", { waitUntil: "load" });
  await page.click(".brief-send");
  await page.waitForTimeout(300);
  check(!posted, "an empty submit never reaches the server (blocked by native validation)");
  await ctx.close();
  return out;
}

// Contact, no-JS: a native POST, 303-redirected by the (intercepted) route
// to `/#sent`, shows the receipt via CSS :target alone. ALWAYS intercepts
// /api/contact.
async function checkContactNoJs(browser) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.route("**/api/contact", (route) => route.fulfill({ status: 303, headers: { location: BASE_URL + "/#sent" } }));
  await page.goto(BASE_URL + "/#contact", { waitUntil: "load" });
  await fillBrief(page, CHIP_FIXTURE);
  await page.click(".brief-send");
  await page.waitForLoadState("load");
  check(page.url().endsWith("#sent"), `the 303 lands on #sent (url: ${page.url()})`);
  const visible = await page.evaluate(() => {
    const el = document.getElementById("sent");
    return !!el && el.getClientRects().length > 0;
  });
  check(visible, "the receipt is visible via :target, with no JS");
  await ctx.close();
  return out;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
  });
  // P5 step 3: WebKit contexts use the Playwright-downloaded WebKit build (no
  // executablePath override; `playwright-core install webkit` put it in
  // %LOCALAPPDATA%\ms-playwright). Launched lazily, only if a WebKit context runs.
  let webkitBrowser = null;
  const needsWebkit = CONTEXTS.some(([, opts]) => opts.browserName === "webkit");
  if (needsWebkit) webkitBrowser = await webkit.launch({ headless: true });

  // P5 step 3: a second, GPU-launched instance for "home perf" only — no
  // swiftshader flags, tries ANGLE/D3D11 hardware compositing. Headless Chrome
  // can still fall back to software; checkHomePerf logs the WebGL renderer
  // string so the report can tell which actually happened.
  const gpuBrowser = routes.includes("/")
    ? await chromium.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
      })
    : null;

  // P3: "/projects/*" expands to the live featured-sheet and earlier-work
  // routes (read once from the running app, not hardcoded).
  let featuredRoutes = [];
  let earlierRoute = null;
  if (routes.includes("/projects/*")) {
    const resolved = await resolveProjectRoutes(browser);
    featuredRoutes = resolved.featured;
    earlierRoute = resolved.earlierOne;
  }
  // P4: "/blog/*" expands to the live post routes, same approach.
  let blogRoutes = [];
  if (routes.includes("/blog/*")) {
    blogRoutes = await resolveBlogRoutes(browser);
  }
  const expandedRoutes = routes.flatMap((r) => {
    if (r === "/projects/*") return [...featuredRoutes, ...(earlierRoute ? [earlierRoute] : [])];
    if (r === "/blog/*") return blogRoutes;
    return [r];
  });
  const slugOf = (routePath) => routePath.replace("/projects/", "");

  let allOk = true;
  for (const [name, rawOpts] of CONTEXTS) {
    const { browserName, ...opts } = rawOpts;
    const isJs = opts.javaScriptEnabled !== false;
    const isTouch = opts.hasTouch === true;
    const targetBrowser = browserName === "webkit" ? webkitBrowser : browser;
    const context = await targetBrowser.newContext(opts);
    const page = await context.newPage();

    for (const routePath of expandedRoutes) {
      const lines = await checkRoute(page, routePath, name);
      for (const r of lines) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}${routePath}] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    if (isJs && routes.includes("/")) {
      await page.goto(BASE_URL + "/", { waitUntil: "load" });
      for (const r of await checkConstruction(page, isTouch)) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}/ construction] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    if (expandedRoutes.includes("/projects")) {
      const lines = isJs ? await checkWorksIndex(page, isTouch) : await checkNoJsProjects(page);
      for (const r of lines) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}/projects works-index] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    for (const routePath of featuredRoutes) {
      if (!expandedRoutes.includes(routePath)) continue;
      const slug = slugOf(routePath);
      const lines = isJs ? await checkSheet(page, slug) : await checkNoJsSheet(page, slug);
      for (const r of lines) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}${routePath}] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    // P4: blog article + about checks — structural/CSS only, so they run the
    // same way in every context (JS and no-JS alike).
    for (const routePath of blogRoutes) {
      if (!expandedRoutes.includes(routePath)) continue;
      const lines = await checkBlogArticle(page, routePath);
      for (const r of lines) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}${routePath}] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    if (expandedRoutes.includes("/about")) {
      const lines = await checkAbout(page);
      for (const r of lines) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}/about] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    if (earlierRoute && expandedRoutes.includes(earlierRoute)) {
      const lines = await checkEarlierNoFigure(page, slugOf(earlierRoute));
      for (const r of lines) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${name}${earlierRoute}] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }

    await context.close();
  }

  if (routes.some((r) => r.startsWith("/projects"))) {
    for (const r of await checkSheetNavigation(browser)) {
      console.log(`${r.ok ? "PASS" : "FAIL"} [navigation] ${r.msg}`);
      if (!r.ok) allOk = false;
    }
  }

  // P3b home block: the stage (lazy-load, lock, touch, scroll story,
  // overflow, perf) and the routed contact brief. Each check opens its own
  // context, so these run once, independent of the CONTEXTS loop above.
  if (routes.includes("/")) {
    const homeChecks = [
      ["stage lazy-load", checkStageLazyLoad],
      ["stage lock", checkStageLock],
      ["stage touch", checkStageTouch],
      ["stage scroll story", checkStageScrollStep],
      ["home overflow 390", checkHomeOverflow390],
      ["contact armed+sent", checkContactArmedAndSent],
      ["contact field error", checkContactFieldError],
      ["contact empty submit", checkContactEmptySubmitBlocked],
      ["contact no-JS", checkContactNoJs],
    ];
    for (const [label, fn] of homeChecks) {
      for (const r of await fn(browser)) {
        console.log(`${r.ok ? "PASS" : "FAIL"} [${label}] ${r.msg}`);
        if (!r.ok) allOk = false;
      }
    }
    for (const r of await checkHomePerf(gpuBrowser)) {
      console.log(`${r.ok ? "PASS" : "FAIL"} [home perf] ${r.msg}`);
      if (!r.ok) allOk = false;
    }
  }

  await browser.close();
  if (webkitBrowser) await webkitBrowser.close();
  if (gpuBrowser) await gpuBrowser.close();
  console.log(allOk ? "VERIFY OK" : "VERIFY FAIL");
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  console.log("VERIFY FAIL");
  process.exit(1);
});
