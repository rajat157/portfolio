// BUILD-PLAN.md §5 P5 step 4: a static public/og-image.png (1200x630), screenshotted
// once from an HTML template with playwright-core + system Chrome. "Rajat." in the
// display face with the orange square, the role in a mono label, on the lab ground.
import { chromium } from "playwright-core";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  @font-face {
    font-family: 'Instrument Sans';
    src: url('https://fonts.gstatic.com/s/instrumentsans/v5/pxiSzvEnrXGItzBtzhHNrNmSiTYbv0Pa2zcJtQ-fP44.ttf');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; background: #E7E9EC; }
  body {
    display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
    padding-left: 96px; font-family: 'Instrument Sans', Arial, sans-serif;
  }
  .name { display: flex; align-items: baseline; font-size: 168px; font-weight: 700; color: #0D0F12; line-height: 1; }
  .sq { width: 26px; height: 26px; background: #FF4D12; margin-left: 10px; margin-bottom: 18px; }
  .role {
    margin-top: 28px; font-family: ui-monospace, monospace; font-size: 22px; letter-spacing: .08em;
    text-transform: uppercase; color: #4F5560;
  }
</style></head>
<body>
  <div class="name">Rajat<div class="sq"></div></div>
  <div class="role">Software Architect &amp; Developer</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
const buf = await page.screenshot({ type: "png" });
await browser.close();

const out = path.resolve(dirname, "../public/og-image.png");
writeFileSync(out, buf);
console.log(`wrote ${out} (${buf.length} bytes)`);
