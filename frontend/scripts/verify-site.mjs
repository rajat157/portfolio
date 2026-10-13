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

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
  });

  let allOk = true;
  for (const [name, opts] of CONTEXTS) {
    const isJs = opts.javaScriptEnabled !== false;
    const isTouch = name.startsWith("phone");
    const context = await browser.newContext(opts);
    const page = await context.newPage();

    for (const routePath of routes) {
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

    await context.close();
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
