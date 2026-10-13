// BUILD-PLAN.md §4.7 Q6b: grain cost. System Chrome via playwright-core, context
// 390x844 @3 touch, against `next start` (VERIFY_BASE_URL or http://localhost:3000).
// CDP Emulation.setCPUThrottlingRate {rate: 4}. Three variants: grain off
// (.kit-grain{display:none}), multiply (shipped), normal (mix-blend-mode: normal).
// For each: load /, then in-page scroll scrollBy(0, 8) per rAF for 300 frames down
// and 300 up, recording performance.now() deltas. 3 runs, report median p50/p95
// frame ms and % frames > 25ms. Visual: screenshot /projects/staffing-operations-platform
// under multiply vs normal, mean absolute channel difference via canvas.
//
// Deviation from the plan text: the plan's "wait for data-intro=done" refers to an
// intro-timing hook that §4.5/§0 superseded before it was ever built; no such
// attribute exists in the shipped code (grep confirms). This script waits on
// `waitUntil: "load"` instead, matching verify-site.mjs's own checkHomePerf, which
// measures the same page under the same superseded assumption.
import { chromium } from "playwright-core";

const BASE_URL = process.env.VERIFY_BASE_URL || "http://localhost:3000";
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const VARIANTS = {
  off: `.kit-grain{display:none !important}`,
  multiply: ``, // shipped: mix-blend-mode: multiply
  normal: `.kit-grain{mix-blend-mode:normal !important}`,
};

function percentile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function measureOnce(browser, css) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  if (css) await page.addStyleTag({ content: css });
  const client = await ctx.newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  if (css) await page.addStyleTag({ content: css }); // re-apply post-navigation styles

  const frames = await page.evaluate(async () => {
    function framesFor(dy, n) {
      return new Promise((resolve) => {
        const deltas = [];
        let last = performance.now();
        let count = 0;
        function step() {
          const now = performance.now();
          deltas.push(now - last);
          last = now;
          window.scrollBy(0, dy);
          count++;
          if (count < n) requestAnimationFrame(step);
          else resolve(deltas);
        }
        requestAnimationFrame(step);
      });
    }
    const down = await framesFor(8, 300);
    const up = await framesFor(-8, 300);
    return [...down, ...up];
  });
  await ctx.close();
  return frames.slice(1); // drop the first delta (baseline, not a real frame interval)
}

async function visualDiff(browser) {
  const shots = {};
  for (const variant of ["multiply", "normal"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE_URL + "/projects/staffing-operations-platform", { waitUntil: "load" });
    if (VARIANTS[variant]) await page.addStyleTag({ content: VARIANTS[variant] });
    shots[variant] = await page.screenshot({ type: "png" });
    await ctx.close();
  }
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const diff = await page.evaluate(
    async ([a, b]) => {
      async function toImageData(buf) {
        const blob = new Blob([new Uint8Array(buf)], { type: "image/png" });
        const bmp = await createImageBitmap(blob);
        const c = document.createElement("canvas");
        c.width = bmp.width;
        c.height = bmp.height;
        const g = c.getContext("2d");
        g.drawImage(bmp, 0, 0);
        return g.getImageData(0, 0, c.width, c.height).data;
      }
      const da = await toImageData(a);
      const db = await toImageData(b);
      let sum = 0;
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
        n += 3;
      }
      return sum / n;
    },
    [Array.from(shots.multiply), Array.from(shots.normal)]
  );
  await ctx.close();
  return diff;
}

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

const table = [];
for (const [name, css] of Object.entries(VARIANTS)) {
  const runs = [];
  for (let i = 0; i < 3; i++) runs.push(await measureOnce(browser, css));
  // Combine the 3 runs' frames for p50/p95/dropped%, as the plan's "report the median p50/p95" is
  // read as: compute p50/p95 per run, then take the median of the 3.
  const perRun = runs.map((frames) => {
    const sorted = [...frames].sort((a, b) => a - b);
    const p50 = percentile(sorted, 50);
    const p95 = percentile(sorted, 95);
    const dropped = (sorted.filter((f) => f > 25).length / sorted.length) * 100;
    return { p50, p95, dropped };
  });
  const median = (arr) => [...arr].sort((a, b) => a - b)[1];
  table.push({
    variant: name,
    p50: median(perRun.map((r) => r.p50)).toFixed(2),
    p95: median(perRun.map((r) => r.p95)).toFixed(2),
    dropped: median(perRun.map((r) => r.dropped)).toFixed(1),
  });
}

console.table(table);

const diff = await visualDiff(browser);
console.log(`visual mean |channel delta| (multiply vs normal): ${diff.toFixed(4)} / 255`);

const off = table.find((t) => t.variant === "off");
const normal = table.find((t) => t.variant === "normal");
const visualOk = diff <= 1.0;
const perfOk = Number(normal.p95) <= 1.1 * Number(off.p95) && Number(normal.dropped) <= Number(off.dropped) + 2;
console.log(`decision: ${visualOk ? "visually normal ~= multiply" : "visual diff too high"}; ${perfOk ? "normal perf within budget of off" : "normal perf over budget"}`);
console.log(
  visualOk && perfOk
    ? "SHIP: mix-blend-mode: normal, grain everywhere"
    : visualOk
      ? "SHIP: mix-blend-mode: normal, but add @media (pointer: coarse){.kit-grain{display:none}}"
      : "KEEP: mix-blend-mode: multiply (visual diff too high to switch)"
);

await browser.close();
