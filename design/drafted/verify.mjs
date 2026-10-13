#!/usr/bin/env node
/*
 * verify-template.mjs — shared test harness for KIT-based single-file prototypes.
 *
 * Usage:
 *   node verify-template.mjs [path/to/study.html]   # defaults to ./demo.html
 *
 * Launches the real installed Chrome via playwright-core (headless), wraps the
 * study file in a host-like preview document (viewport meta + CSP meta), runs
 * it in four contexts, and checks: no console/page errors, "[proto] ready" is
 * logged, mobile doesn't horizontally overflow, and no banned words appear in
 * visible text or aria-label/title/alt attributes (code blocks excluded).
 *
 * Exit code 0 + "VERIFY OK" on success, 1 + "VERIFY FAIL" otherwise.
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const studyPath = path.resolve(process.argv[2] || path.join(__dirname, '..', 'drafted.html'));
const screenshotDir = path.join(__dirname, 'screenshots');
mkdirSync(screenshotDir, { recursive: true });

const CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; " +
  "style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; " +
  "img-src data: blob:; connect-src 'none'; worker-src blob:";

const BANNED_WORDS = [
  'overdrive', 'gain', 'signal', 'oscilloscope', 'hud', 'slam', 'loadout', 'riff', 'amp',
  'metal', 'level', 'hp', 'guitar', 'chord', 'stage', 'boss', 'quest', 'loot', 'respawn',
  'headshot', 'combo', 'score', 'track', 'album', 'band', 'mixtape',
];
// plurals count too: "stages" is "stage"
const bannedRegex = new RegExp('\\b(' + BANNED_WORDS.join('|') + ')s?\\b', 'i');
// The list polices design copy, not facts: text inside [data-fact] (factual project content)
// and <code> is skipped, and the exact phrase "row-level" (a database term) is allowed anywhere.
// Everything else is scanned: visible text, hero, labels, UI chrome, readouts, and every
// aria-label / title / alt (outside <code>).
const WHITELIST = /row-level/gi;
async function bannedHit(page, rootSel, re = bannedRegex) {
  const { text, codeTexts, attrs } = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    // hide fact subtrees for one synchronous read, so innerText keeps its usual visibility rules
    const st = document.createElement('style');
    st.textContent = '[data-fact]{display:none!important}';
    document.head.appendChild(st);
    const text = root.innerText || '';
    const codeTexts = Array.from(root.querySelectorAll('code')).map((c) => c.innerText || c.textContent || '');
    st.remove();
    const list = [];
    root.querySelectorAll('[aria-label],[title],[alt]').forEach((el) => {
      if (el.closest('code')) return;
      ['aria-label', 'title', 'alt'].forEach((a) => {
        const v = el.getAttribute(a);
        if (v) list.push(v);
      });
    });
    return { text, codeTexts, attrs: list.join('\n') };
  }, rootSel);
  let t = text;
  for (const ct of codeTexts) if (ct) t = t.split(ct).join('');
  const m = (t + '\n' + attrs).replace(WHITELIST, ' ').match(re);
  return m ? m[0] : null;
}

function buildPreviewHtml(studyHtml) {
  const metaTags =
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  // `<head(\s[^>]*)?>` so a <header> element is not mistaken for <head> (template regex fix)
  if (/<head(\s[^>]*)?>/i.test(studyHtml)) {
    return studyHtml.replace(/<head(\s[^>]*)?>/i, (m) => m + '\n' + metaTags);
  }
  return `<!doctype html>\n<html>\n<head>\n${metaTags}\n</head>\n<body>\n${studyHtml}\n</body>\n</html>`;
}

// host shim: constant rAF timestamp + document.hidden/visibilityState forced hidden.
// This is the hostile-host emulation KIT.loop is designed around (never read the
// rAF arg, never check document.hidden — see kit.js).
function hostShim() {
  const fixedTs = 1000;
  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => origRaf(() => cb(fixedTs));
  Object.defineProperty(document, 'hidden', { get: () => true, configurable: true });
  Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
}

// STUDY HOOK ---------------------------------------------------------------
// Drafted: rows draft their architecture (inline under the row on narrow screens);
// one "Show construction" button reveals the construction (no single-key shortcut);
// every sheet opens with its four blocks, the case-study link and the source wording,
// and closes back to the index; each letter's construction box matches the rendered
// glyph within 2 px; and with JavaScript off the static sheets carry all of it.
// Returns [{ ok, msg }] result lines.
const PROJECTS = [
  ['offpriced', 'https://www.rajatkumarr.com/projects/b2b-wholesale-platform'],
  ['staffing', 'https://www.rajatkumarr.com/projects/staffing-operations-platform'],
  ['lucif3r', 'https://www.rajatkumarr.com/projects/esports-talent-portfolio'],
  ['tredye', 'https://www.rajatkumarr.com/projects/tredye-trading-platform'],
];
const SOURCE = { // facts that were once reworded for the copy check; they must read as the source does
  staffing: ['row-level security', 'Row-Level Security'],
  lucif3r: ['stage host and broadcast voice', 'a gallery from the stage', 'proof of the stages already worked'],
  tredye: ['Each stage runs in its own container', 'a shared Docker build stage'],
};
const HEADS = 'Problem|What I built|Key decisions|Outcome';

// Each letter's construction box (its dashed ink box) against the rendered glyph's ink:
// hide every other letter, screenshot the box at 1 CSS px per pixel, find the ink pixels.
async function letterBoxes(page) {
  await page.mouse.move(5, 5);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  const boxes = await page.evaluate(() => {
    const svg = document.getElementById('nameSvg'), r = svg.getBoundingClientRect(), s = r.width / svg.viewBox.baseVal.width;
    return [...svg.querySelectorAll('.cd')].map((g) => {
      const b = g.querySelector('rect');
      return { g: +g.dataset.g, x: r.left + +b.getAttribute('x') * s, y: r.top + +b.getAttribute('y') * s, w: +b.getAttribute('width') * s, h: +b.getAttribute('height') * s };
    });
  });
  let worst = 0;
  const bad = [];
  for (const b of boxes) {
    await page.evaluate((gi) => {
      document.querySelectorAll('#nameSvg .glyph, #nameSvg .dot').forEach((n, i) => { n.style.visibility = i === gi ? '' : 'hidden'; });
    }, b.g);
    const pad = 24;
    const clip = { x: Math.max(0, Math.floor(b.x - pad)), y: Math.max(0, Math.floor(b.y - pad)), width: Math.ceil(b.w + 2 * pad), height: Math.ceil(b.h + 2 * pad) };
    const png = await page.screenshot({ clip, scale: 'css' });
    const ink = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let l = Infinity, r = -Infinity, t = Infinity, bt = -Infinity;
      for (let yy = 0; yy < c.height; yy++) {
        for (let xx = 0; xx < c.width; xx++) {
          const o = (yy * c.width + xx) * 4;
          // ink: differs from the lab ground (231, 233, 236) by about a third of full contrast or more
          if (Math.abs(d[o] - 231) + Math.abs(d[o + 1] - 233) + Math.abs(d[o + 2] - 236) > 200) {
            l = Math.min(l, xx); r = Math.max(r, xx + 1); t = Math.min(t, yy); bt = Math.max(bt, yy + 1);
          }
        }
      }
      return { l, r, t, b: bt };
    }, png.toString('base64'));
    const bl = b.x - clip.x, btp = b.y - clip.y;
    const dev = Math.max(Math.abs(bl - ink.l), Math.abs(bl + b.w - ink.r), Math.abs(btp - ink.t), Math.abs(btp + b.h - ink.b));
    const devR = Math.round(dev * 10) / 10;
    worst = Math.max(worst, devR);
    if (!(dev <= 2)) bad.push(`#${b.g} off by ${devR}`);
  }
  await page.evaluate(() => document.querySelectorAll('#nameSvg .glyph, #nameSvg .dot').forEach((n) => { n.style.visibility = ''; }));
  return { n: boxes.length, worst, bad };
}

// The same page with JavaScript off: the static sheets must carry every word and link.
async function noJsFallback(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.setContent(buildPreviewHtml(readFileSync(studyPath, 'utf8')), { waitUntil: 'load' });
  const r = await p.evaluate(() => {
    const vis = (el) => !!el && el.getClientRects().length > 0;
    return {
      sheetsVisible: vis(document.getElementById('sheets')),
      sheets: [...document.querySelectorAll('#sheets .psheet')].map((s) => ({
        id: s.id,
        visible: vis(s),
        heads: [...s.querySelectorAll('.blk-h')].map((h) => h.textContent).join('|'),
        lines: s.querySelectorAll('.ln').length,
        link: (s.querySelector('.tb-link') || {}).href,
        diaText: vis(s.querySelector('.dia-text')),
      })),
      rowLinks: [...document.querySelectorAll('#rows .rowbtn')].map((a) => a.getAttribute('href')),
      blocks: [document.querySelectorAll('.blk').length, document.querySelectorAll('.blk:not(.psheet .blk)').length],
      toolsHidden: ['#consBtn', '.panel', '.key', '.hint', '#copyBtn'].every((sel) => !vis(document.querySelector(sel))),
    };
  });
  const hit = await bannedHit(p, 'body');
  await p.screenshot({ path: path.join(screenshotDir, 'nojs-1440x900.png'), fullPage: true });
  await ctx.close();
  return { ...r, hit };
}

async function studyInteractions(page, contextName) {
  const out = [];
  const check = (ok, msg) => out.push({ ok: !!ok, msg });
  const touch = contextName.startsWith('mobile');
  const shot = (n) => page.screenshot({ path: path.join(screenshotDir, `${contextName}-${n}.png`) });
  const drafted = (sel, id) => page.waitForFunction(([s, i]) => {
    const el = document.querySelector(s);
    return el && el.dataset.project === i && el.dataset.state === 'inked';
  }, [sel, id], { timeout: 8000 }).then(() => true, () => false);
  const dashZero = (sel) => page.evaluate((s) => {
    const p = document.querySelector(`${s} path.d-edge`);
    return p ? getComputedStyle(p).strokeDashoffset : 'missing';
  }, sel);
  const row = (i) => page.locator('#rows tr.prow').nth(i);
  // drawing geometry: no two parts overlap, and every label sits inside the drawing
  const geometry = (sel) => page.evaluate((s) => {
    const svg = document.querySelector(s), W = +svg.getAttribute('width');
    const bx = [...svg.querySelectorAll('path.d-box')].map((p) => p.getBBox());
    let overlap = 0;
    for (let i = 0; i < bx.length; i++) {
      for (let j = i + 1; j < bx.length; j++) {
        const a = bx[i], b = bx[j];
        if (a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1) overlap++;
      }
    }
    const out = [...svg.querySelectorAll('text')].filter((t) => { const b = t.getBBox(); return b.x < -0.5 || b.x + b.width > W + 0.5; }).map((t) => t.textContent);
    return { overlap, out };
  }, sel);
  const geoCheck = async (sel, what) => {
    const g = await geometry(sel);
    check(g.overlap === 0 && g.out.length === 0, `${what}: no overlapping parts, every label inside the drawing${g.overlap ? '; ' + g.overlap + ' overlaps' : ''}${g.out.length ? '; outside: ' + g.out.join(' | ') : ''}`);
  };
  const consOn = () => page.evaluate(() => ({
    on: document.documentElement.dataset.construction === 'on',
    op: getComputedStyle(document.querySelector('#nameSvg .cons')).opacity,
    label: document.querySelector('#consBtn .tg-label').textContent,
    guides: document.querySelectorAll('#guides path').length,
  }));

  // a mid-intro frame (construction on screen), then wait for the ink to land
  await page.waitForTimeout(650);
  await shot('intro');
  const introDone = await page.waitForFunction(() => document.documentElement.dataset.intro === 'done', null, { timeout: 9000 }).then(() => true, () => false);
  check(introDone, 'hero constructed then inked (data-intro=done)');
  const heroInk = await page.evaluate(() => [...document.querySelectorAll('#nameSvg .glyph')].map((g) => g.textContent).join(''));
  check(heroInk === 'RajatKumarR', `hero glyphs inked: ${heroInk}`);
  const blocks = await page.evaluate(() => [document.querySelectorAll('.blk').length, document.querySelectorAll('.blk:not(.psheet .blk)').length]);
  check(blocks[0] === 16 && blocks[1] === 0, `markup: exactly 16 blocks, all inside the four sheets (${blocks[0]} total, ${blocks[1]} stray)`);

  // letter construction matches the rendered letters
  const lb = await letterBoxes(page);
  check(lb.n === 12 && lb.bad.length === 0, `each letter's construction box is within 2 px of the rendered glyph (${lb.n} boxes, worst ${lb.worst} px${lb.bad.length ? '; ' + lb.bad.join(', ') : ''})`);

  // discovery (fine pointers): a letter reveals its construction; any inked element its guides
  if (!touch) {
    const r = await page.locator('#nameSvg').boundingBox();
    await page.mouse.move(r.x + r.width * 0.04, r.y + r.height * 0.55);
    await page.waitForFunction(() => { const n = document.querySelector('#nameSvg .cd.hot'); return n && getComputedStyle(n).opacity === '1'; }, null, { timeout: 2000 }).catch(() => {});
    const hotOp = await page.evaluate(() => { const n = document.querySelector('#nameSvg .cd.hot'); return n ? getComputedStyle(n).opacity : 'none'; });
    check(hotOp === '1', `hover on a letter shows its construction (detail opacity ${hotOp})`);
    await page.locator('.process').hover();
    await page.waitForTimeout(700);
    const g = await page.evaluate(() => ({ n: document.querySelectorAll('#guides path').length, text: document.getElementById('guides').textContent }));
    check(g.n > 0 && /^\d+$/.test(g.text.trim()), `hover on the process line draws its guides and a px dimension, no font readout (${g.n} paths, text "${g.text.trim()}")`);
    const stale = await page.evaluate(() => [...document.querySelectorAll('#nameSvg .hot')].map((n) => n.dataset.g + ':' + getComputedStyle(n).opacity));
    check(stale.length === 0, `leaving the name clears its letter construction (${stale.join(',') || 'none hot'})`);
    await shot('hover');
    await page.mouse.move(5, 5);
  }

  // works index: every row drafts its architecture
  await page.locator('#works').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  // rows 01 -> 04 in order; on touch, row 01 is already drafted by scrolling, so its tap is the first-tap case
  const rowTops = () => page.evaluate(() => [...document.querySelectorAll('#rows tr.prow')].map((r) => Math.round((r.getBoundingClientRect().top + scrollY) * 2) / 2));
  for (const i of [0, 1, 2, 3]) {
    const [id] = PROJECTS[i];
    if (touch) {
      await row(i).locator('td.sh').tap();
    } else {
      // hover with a mouse: no row may move, and the pointer must still be over the row it hovered
      await row(i).scrollIntoViewIfNeeded();
      const before = await rowTops();
      const bb = await row(i).boundingBox();
      await page.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height / 2);
      await drafted('#panelSvg', id);
      const after = await rowTops();
      const still = await page.evaluate(([x, y, k]) => {
        const el = document.elementFromPoint(x, y);
        return !!el && el.closest('tr.prow') === document.querySelectorAll('#rows tr.prow')[k];
      }, [bb.x + bb.width * 0.3, bb.y + bb.height / 2, i]);
      const moved = before.map((t, k) => Math.abs(t - after[k])).reduce((a, b) => Math.max(a, b), 0);
      check(moved === 0 && still, `hover row ${i + 1}: no row moves and the pointer stays on it (largest shift ${moved} px)`);
    }
    const ok = await drafted('#panelSvg', id);
    const off = await dashZero('#panelSvg');
    check(ok && (off === '0px' || off === '0'), `${touch ? 'tap' : 'hover'} row ${i + 1} drafts ${id} (state ${ok ? 'inked' : 'NOT inked within 8 s'}, edge dashoffset ${off})`);
    await geoCheck('#panelSvg', `${id} panel drawing`);
    const lab = await page.evaluate((k) => ({
      label: document.getElementById('panelSvg').getAttribute('aria-label') || '',
      name: document.querySelectorAll('#rows .rowbtn')[k].textContent,
      live: document.getElementById('panel-h').getAttribute('aria-live'),
    }), i);
    check(lab.label.startsWith('Architecture of ' + lab.name + ': ') && !lab.live, `${id} panel drawing is labelled "${lab.label.slice(0, 44)}…"; its heading is not a live region`);
    if (touch) {
      const st = await page.evaluate(() => document.getElementById('inspect').dataset.state);
      check(st === 'closed', `first tap on row ${i + 1} drafts without opening (${st})`);
      const inl = await page.evaluate((k) => {
        const rws = [...document.querySelectorAll('#rows tr.prow')], panel = document.querySelector('.panel'), tr = panel.closest('tr');
        const p = panel.getBoundingClientRect();
        return { after: !!tr && tr.previousElementSibling === rws[k], top: Math.round(p.top), bottom: Math.round(p.bottom), vh: innerHeight };
      }, i);
      check(inl.after && inl.top >= 60 && inl.bottom <= inl.vh + 1, `tap row ${i + 1}: the drawing sits inline under the row, in view (top ${inl.top}, bottom ${inl.bottom} of ${inl.vh})`);
    }
  }
  if (!touch) {
    const place = await page.evaluate(() => (document.querySelector('.panel').closest('tr') ? 'inline' : innerWidth >= 1200 ? 'beside the table' : 'below the table'));
    check(place !== 'inline', `with a mouse the drawing keeps its own place (${place}), never inline between rows`);
    await page.mouse.move(5, 5);
    await row(2).locator('.rowbtn').focus();
    check(await drafted('#panelSvg', 'lucif3r'), 'keyboard focus on row 3 drafts lucif3r');
  }
  await shot('works');

  // construction: one plain button, keyboard-operable; no single-key shortcut
  await page.evaluate(() => window.scrollTo(0, 0));
  const btn = page.locator('#consBtn');
  const bb = await btn.boundingBox();
  check(bb && bb.width >= 44 && bb.height >= 44 && (await consOn()).label === 'Show construction', `"Show construction" is one >=44px button (${bb ? Math.round(bb.width) + 'x' + Math.round(bb.height) : 'none'})`);
  if (touch) await btn.tap(); else { await btn.focus(); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(600);
  const on = await consOn();
  check(on.on && on.op === '1' && on.guides > 0 && on.label === 'Hide construction', `${touch ? 'tap' : 'Enter'} shows construction (opacity ${on.op}, ${on.guides} guide paths, label "${on.label}")`);
  const readouts = await page.evaluate(() => (document.getElementById('guides').textContent + ' ' + document.getElementById('nameSvg').textContent));
  check(!/Instrument|Martian|wght|wdth/i.test(readouts), 'construction shows drafting only: no font-spec readouts');
  const vocab = await bannedHit(page, 'body', /\b(layers?|cad|ink mode)\b/i);
  check(!vocab, `no layer or CAD vocabulary in visible text or aria${vocab ? ': "' + vocab + '"' : ''}`);
  await page.waitForTimeout(500);
  await shot('construction');
  await page.keyboard.press('l');
  await page.waitForTimeout(200);
  check((await consOn()).on, 'pressing "l" changes nothing (no single-key shortcut)');
  if (touch) await btn.tap(); else await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  const off = await consOn();
  check(!off.on && off.op === '0' && off.label === 'Show construction', `${touch ? 'tap' : 'Space'} hides construction again (opacity ${off.op})`);

  // inspect: open every sheet, check the blocks, the link and the source wording, close back to the index
  for (const [i, [id, url]] of PROJECTS.entries()) {
    await row(i).scrollIntoViewIfNeeded();
    if (touch) {
      await row(i).locator('td.sh').tap(); // drafts; if this row was already drafted, the tap opens it
      await page.waitForTimeout(200);
      if (await page.evaluate(() => document.getElementById('inspect').dataset.state === 'closed')) await page.locator('#openBtn').tap();
    } else {
      // hover the row, let it draft, then click where the pointer already is (no re-targeting)
      const bb = await row(i).locator('.rowbtn').boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await drafted('#panelSvg', id);
      await page.mouse.down();
      await page.mouse.up();
    }
    const open = await page.waitForFunction(() => document.getElementById('inspect').dataset.state === 'open', null, { timeout: 5000 }).then(() => true, () => false);
    await page.locator('#inspect .fig-box').scrollIntoViewIfNeeded(); // the drawing drafts when it is seen
    const big = await drafted('#inspect .dia-big', id);
    if (big) await geoCheck('#inspect .dia-big', `${id} sheet drawing`);
    const info = await page.evaluate(() => ({
      heads: [...document.querySelectorAll('#inspect .blk-h')].map((h) => h.textContent),
      lines: [...document.querySelectorAll('#inspect .blk')].map((b) => b.querySelectorAll('.ln').length),
      href: document.querySelector('#inspect .tb-link').href,
      linkText: document.querySelector('#inspect .tb-link').innerText,
      text: document.getElementById('inspect').innerText,
      focus: document.activeElement && document.activeElement.id,
      labelledby: document.getElementById('inspect').getAttribute('aria-labelledby'),
      skipInert: document.querySelector('.skip').inert,
      cap: (document.querySelector('#inspect .fig-cap') || {}).textContent || '',
    }));
    check(open && big, `${touch ? 'tap' : 'click on the hovered row'} opens the ${id} sheet: expanded and drawing inked`);
    check(info.heads.join('|') === HEADS && info.lines.every((n) => n > 0), `${id} sheet has the four plain blocks (${info.lines.join('/')} lines)`);
    check(info.href === url && /Full case study/.test(info.linkText), `${id} title block links ${info.href}`);
    check(info.focus === 't-' + id && info.labelledby === 't-' + id, `${id} sheet takes focus on its title and is labelled by it`);
    check(info.skipInert, `${id} sheet: the skip link is inert behind the sheet`);
    check(touch ? /tap the drawing/.test(info.cap) : /hover the drawing/.test(info.cap), `${id} caption fits the pointer ("${info.cap.split(' · ').pop()}")`);
    const missing = (SOURCE[id] || []).filter((s) => !info.text.includes(s));
    if (SOURCE[id]) check(!missing.length, `${id} sheet keeps the source wording${missing.length ? ', missing: ' + missing.join(' | ') : ' (' + SOURCE[id].length + ' phrases)'}`);
    const hit = await bannedHit(page, '#inspect');
    check(!hit, `${id} sheet copy (outside facts) has no banned words${hit ? ': "' + hit + '"' : ''}`);
    if (id === 'staffing' || contextName === 'desktop-1440x900') {
      await page.waitForTimeout(300);
      await shot(`inspect-${id}`); // desktop: the sheet as it lands; mobile: the drawing in view
      const sh = await page.evaluate(() => document.getElementById('inspect').scrollHeight);
      for (let y = 300; y < sh + 300; y += 300) { // scroll like a reader, so each block meets the viewport
        await page.evaluate((v) => { document.getElementById('inspect').scrollTop = v; }, y);
        await page.waitForTimeout(220);
      }
      await page.waitForTimeout(2400);
      const inked = await page.evaluate(() => [...document.querySelectorAll('#inspect .blk')].every((b) => b.classList.contains('is-in')));
      check(inked, `${id} blocks inked in on scroll`);
      await shot(`inspect-${id}-blocks`);
    }
    await page.keyboard.press('Escape');
    const closed = await page.waitForFunction(() => document.getElementById('inspect').dataset.state === 'closed', null, { timeout: 5000 }).then(() => true, () => false);
    const after = await page.evaluate((pid) => ({ hidden: document.getElementById('inspect').hidden, focus: document.activeElement && document.activeElement.textContent, inert: document.querySelector('main').inert, home: !!document.querySelector('#sheets #p-' + pid) }), id);
    check(closed && after.hidden && !after.inert && after.home, `close ${id} returns to the index, sheet back in place (focus: ${after.focus})`);
  }

  // controls: the copy check still catches design copy (plurals too), skips facts, allows only "row-level"
  const probe = async (where, word) => {
    await page.evaluate(([w, s]) => {
      const host = document.querySelector(w), sp = document.createElement('span');
      sp.id = 'copy-probe'; sp.textContent = ' ' + s;
      host.appendChild(sp);
    }, [where, word]);
    const hitWord = await bannedHit(page, 'body');
    await page.evaluate(() => document.getElementById('copy-probe').remove());
    return hitWord && hitWord.toLowerCase(); // labels render uppercase (text-transform)
  };
  const c1 = await probe('.meta .lab', 'stage');
  const c1p = await probe('.meta .lab', 'stages');
  check(c1 === 'stage' && c1p === 'stages', `control: "stage" and "stages" in UI chrome are caught (${c1}, ${c1p})`);
  const c2 = await probe('#panel-cap', 'stage');
  check(c2 === null, `control: "stage" inside [data-fact] is skipped (${c2})`);
  const c3 = await probe('.meta .lab', 'row-level');
  const c4 = await probe('.meta .lab', 'level');
  check(c3 === null && c4 === 'level', `control: "row-level" allowed (${c3}), bare "level" caught (${c4})`);

  // fallback-first: the same page with JavaScript off (checked once)
  if (contextName === 'desktop-1440x900') {
    const nj = await noJsFallback(page.context().browser());
    const want = PROJECTS.map(([pid]) => '#p-' + pid);
    check(nj.sheetsVisible && nj.sheets.length === 4 && nj.sheets.every((s) => s.visible && s.heads === HEADS && s.lines > 0 && s.diaText),
      `JavaScript off: four static sheets, each with its four blocks and a plain architecture line (${nj.sheets.map((s) => s.id + ':' + s.lines).join(' ')})`);
    check(nj.sheets.every((s, k) => s.link === PROJECTS[k][1]), 'JavaScript off: each sheet links its full case study');
    check(nj.rowLinks.join() === want.join(), `JavaScript off: index rows link to their sheets (${nj.rowLinks.join(' ')})`);
    check(nj.toolsHidden, 'JavaScript off: script-only controls stay hidden');
    check(nj.blocks[0] === 16 && nj.blocks[1] === 0, `JavaScript off: exactly 16 blocks, all inside the four sheets (${nj.blocks[0]} total, ${nj.blocks[1]} stray)`);
    check(!nj.hit, `JavaScript off: no banned words${nj.hit ? ': "' + nj.hit + '"' : ''}`);
  }

  await page.mouse.move(5, 5); // park the pointer and let any drafting settle before the full-page shot
  await page.waitForTimeout(1800);
  return out;
}
// ---------------------------------------------------------------------------

async function runContext(browser, name, contextOpts, { mobile = false } = {}) {
  const lines = [];
  let ok = true;
  const context = await browser.newContext(contextOpts);
  await context.addInitScript(hostShim);
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  let readySeen = false;
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[proto] ready')) readySeen = true;
    if (msg.type() === 'error') consoleErrors.push(text);
    if (msg.type() === 'warning') consoleWarnings.push(text);
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const studyHtml = readFileSync(studyPath, 'utf8');
  await page.setContent(buildPreviewHtml(studyHtml), { waitUntil: 'load' });

  const deadline = Date.now() + 5000;
  while (!readySeen && Date.now() < deadline) {
    await page.waitForTimeout(50);
  }
  if (!readySeen) {
    ok = false;
    lines.push(`FAIL [${name}] "[proto] ready" was never logged`);
  } else {
    lines.push(`PASS [${name}] ready`);
  }

  for (const r of (await studyInteractions(page, name)) || []) {
    if (!r.ok) ok = false;
    lines.push(`${r.ok ? 'PASS' : 'FAIL'} [${name}] ${r.msg}`);
  }

  if (consoleErrors.length) {
    ok = false;
    lines.push(`FAIL [${name}] console errors: ${consoleErrors.join(' | ')}`);
  } else {
    lines.push(`PASS [${name}] no console errors`);
  }
  if (pageErrors.length) {
    ok = false;
    lines.push(`FAIL [${name}] page errors: ${pageErrors.join(' | ')}`);
  } else {
    lines.push(`PASS [${name}] no page errors`);
  }
  if (consoleWarnings.length) {
    lines.push(`WARN [${name}] console warnings: ${consoleWarnings.join(' | ')}`);
  }

  if (mobile) {
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth === document.documentElement.clientWidth
    );
    if (!noOverflow) {
      ok = false;
      lines.push(`FAIL [${name}] horizontal overflow (scrollWidth != clientWidth)`);
    } else {
      lines.push(`PASS [${name}] no horizontal overflow`);
    }
  }

  const hit = await bannedHit(page, 'body');
  if (hit) {
    ok = false;
    lines.push(`FAIL [${name}] banned word found: "${hit}"`);
  } else {
    lines.push(`PASS [${name}] no banned words`);
  }

  const screenshotPath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  lines.push(`PASS [${name}] screenshot saved: ${screenshotPath}`);

  await context.close();
  return { ok, lines };
}

async function main() {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
  });

  const contexts = [
    ['desktop-1440x900', { viewport: { width: 1440, height: 900 } }, {}],
    ['desktop-1920x905', { viewport: { width: 1920, height: 905 } }, {}],
    ['desktop-1024x768', { viewport: { width: 1024, height: 768 } }, {}], // mid width with a mouse
    [
      'mobile-390x844',
      { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      { mobile: true },
    ],
    ['reduced-motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, {}],
  ];

  let allOk = true;
  for (const [name, opts, extra] of contexts) {
    const { ok, lines } = await runContext(browser, name, opts, extra);
    for (const line of lines) console.log(line);
    if (!ok) allOk = false;
  }

  await browser.close();

  console.log(allOk ? 'VERIFY OK' : 'VERIFY FAIL');
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error('VERIFY FAIL');
  console.error(err);
  process.exit(1);
});
