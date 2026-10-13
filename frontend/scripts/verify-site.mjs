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
import { chromium } from "playwright-core";

const BASE_URL = process.env.VERIFY_BASE_URL || "http://localhost:3000";
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

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

async function checkRoute(page, routePath) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });

  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); };
  const onPageError = (err) => pageErrors.push(err.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.goto(BASE_URL + routePath, { waitUntil: "load" });
  await page.waitForTimeout(300);

  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? ": " + consoleErrors.join(" | ") : ""}`);
  check(pageErrors.length === 0, `no page errors${pageErrors.length ? ": " + pageErrors.join(" | ") : ""}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `no horizontal overflow (scrollWidth - clientWidth = ${overflow})`);

  const hit = await bannedHit(page);
  check(!hit, `no banned words${hit ? `: "${hit}"` : ""}`);

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.className ?? "");
  check(first.includes("skip"), `skip link is first in tab order (focused className: "${first}")`);

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

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
  });

  // P3: "/projects/*" expands to the live featured-sheet and earlier-work
  // routes (read once from the running app, not hardcoded).
  let featuredRoutes = [];
  let earlierRoute = null;
  if (routes.includes("/projects/*")) {
    const resolved = await resolveProjectRoutes(browser);
    featuredRoutes = resolved.featured;
    earlierRoute = resolved.earlierOne;
  }
  const expandedRoutes = routes.flatMap((r) =>
    r === "/projects/*" ? [...featuredRoutes, ...(earlierRoute ? [earlierRoute] : [])] : [r]
  );
  const slugOf = (routePath) => routePath.replace("/projects/", "");

  let allOk = true;
  for (const [name, opts] of CONTEXTS) {
    const isJs = opts.javaScriptEnabled !== false;
    const isTouch = name.startsWith("phone");
    const context = await browser.newContext(opts);
    const page = await context.newPage();

    for (const routePath of expandedRoutes) {
      const lines = await checkRoute(page, routePath);
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

  await browser.close();
  console.log(allOk ? "VERIFY OK" : "VERIFY FAIL");
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  console.log("VERIFY FAIL");
  process.exit(1);
});
