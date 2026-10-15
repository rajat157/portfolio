"use client";

/* ------------------------------------------------------------------
 * WHERE TO NEXT, AS A SHEET SET (Rajat's pick, option A: the prototype
 * design/drafted/where-to-next-sheet-set.html and its brief). The site map as
 * four drawing sheets standing on a drafting plane, "you are here" in front
 * of them. Point at a sheet, or Tab to its link, and it is marked out: it
 * lifts and turns, its miniature of the page draws itself on and blue
 * construction lines measure it. Click it, or press Enter, and the camera
 * dives in until the paper fills the frame, then the page opens; Contact
 * dives, then scrolls to the brief below. Esc during the dive goes back.
 * Phones tap a sheet to choose it, then Go.
 *
 * All of it is enhancement on page.tsx's plain map: its four links become
 * the labels pinned above the sheets, so no JS, no WebGL and reduced motion
 * keep the plain nodes. `three` loads by dynamic import() once #map nears
 * the viewport, and the scene is disposed again when it is far away.
 *
 * Changed from the prototype: the arrival is the real page (router.push);
 * the dive keeps the layout's pitch and ends with the paper covering the
 * frame, so a phone's tall frame never shows the empty plane above the
 * sheet; colour management stays on, since the stage shares `three`.
 * ------------------------------------------------------------------ */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Group, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import type { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { hasWebGL } from "@/components/home/stage";
import { reducedMotion } from "@/lib/motion";
import { tick, thunk } from "@/lib/sound";

/* ---------- easing (the site's cubic-bezier(.2,0,0,1)) and small maths ---------- */
const bez = (x1: number, y1: number, x2: number, y2: number) => {
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  const dx = (u: number) => 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u = Math.min(1, Math.max(0, u - (bx(u) - t) / d));
    }
    return by(u);
  };
};
const attack = bez(0.2, 0, 0, 1);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
const DEG = Math.PI / 180;
const two = (n: number) => String(n).padStart(2, "0");

/* ---------- a sheet, in sheet units (y up): a √2 landscape sheet, its title block bottom right ---------- */
const U = 0.01; // world units per sheet unit: a sheet is 3.2 × 2.26
const SW = 320;
const SH = 226.3;
const BX = SW / 2;
const BY = SH / 2;
const TB = { x0: 40, x1: 148, y0: -BY + 12, y1: -BY + 48, cell: 32 };
const FOOT = 0.1; // sheets stand this far above the plane
const LIFT = 0.24; // a marked-out sheet lifts by this much
const DRAW_MS = 1000;
const DIVE_MS = 1250;

// strokes: a stroke is a list of segments [x0, y0, x1, y1], drawn in order (the pen lifts between strokes)
type Seg = [number, number, number, number];
type Stroke = Seg[];
const poly = (...p: [number, number][]): Stroke => p.slice(1).map((q, k) => [p[k][0], p[k][1], q[0], q[1]]);
const box = (x0: number, y0: number, x1: number, y1: number) => poly([x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]);
const ln = (x0: number, y0: number, x1: number, y1: number): Stroke => [[x0, y0, x1, y1]];
// a heading's weight
const bold = (x: number, y: number, w: number, n = 3, g = 1.9): Stroke => Array.from({ length: n }, (_, k): Seg => [x, y - k * g, x + w, y - k * g]);
// mono text
const dash = (x: number, y: number, w: number, on = 2.4, off = 1.6) => {
  const s: Stroke = [];
  for (let u = 0; u < w - 0.1; u += on + off) s.push([x + u, y, x + Math.min(w, u + on), y]);
  return s;
};
const vdash = (x: number, y0: number, y1: number, on = 2.4, off = 1.8) => {
  const s: Stroke = [];
  for (let v = y0; v > y1 + 0.1; v -= on + off) s.push([x, v, x, Math.max(y1, v - on)]);
  return s;
};
const arrowDown = (x: number, y0: number, y1: number): Stroke => [...ln(x, y0, x, y1), ...poly([x - 2.6, y1 + 4.6], [x, y1], [x + 2.6, y1 + 4.6])];

// each sheet's miniature of its page, in blue ink
const MINI: (() => Stroke[])[] = [
  // 01 Projects: a system's parts over one application and one database, like the case-study drawings
  () => {
    const S: Stroke[] = [];
    const bw = 54;
    const gap = 11;
    const x0 = -(4 * bw + 3 * gap) / 2;
    const top = 88;
    const bh = 28;
    const cx = (k: number) => x0 + k * (bw + gap) + bw / 2;
    for (let k = 0; k < 4; k++) S.push(box(x0 + k * (bw + gap), top - bh, x0 + k * (bw + gap) + bw, top));
    for (let k = 0; k < 4; k++) S.push(arrowDown(cx(k), top - bh, 32));
    S.push(box(x0, 16, -x0, 32));
    S.push(arrowDown(0, 16, -26));
    S.push(box(x0, -42, -x0, -26));
    [[30], [36, 22], [40, 30], [38, 26]].forEach((ws, k) =>
      ws.forEach((w, j) => {
        const y = top - bh / 2 + (ws.length > 1 ? (j ? -3.6 : 3.6) : 0);
        S.push(ln(cx(k) - w / 2, y, cx(k) + w / 2, y));
      })
    );
    S.push(ln(-24, 24, 24, 24));
    S.push(dash(6, -5, 78));
    S.push(ln(-20, -34, 20, -34));
    return S;
  },
  // 02 Blog: a heading over lines of text
  () => {
    const S: Stroke[] = [];
    const x = -128;
    S.push(bold(x, 90, 70, 5, 2.1));
    S.push(dash(x, 72, 96));
    S.push(ln(x, 64, 128, 64));
    [256, 244, 250, 150].forEach((w, k) => S.push(ln(x, 52 - k * 8, x + w, 52 - k * 8)));
    S.push(bold(x, 14, 112, 3, 1.9));
    [256, 232, 248, 252, 118].forEach((w, k) => S.push(ln(x, 2 - k * 8, x + w, 2 - k * 8)));
    [150, 132].forEach((w, k) => S.push(ln(x, -46 - k * 8, x + w, -46 - k * 8)));
    return S;
  },
  // 03 About: a timeline beside a title block, the skills under it
  () => {
    const S: Stroke[] = [];
    S.push(bold(-128, 92, 62, 6, 2.1));
    S.push(dash(-128, 74, 120));
    S.push(ln(-116, 60, -116, -60));
    [48, 20, -8, -36].forEach((y, k) => {
      S.push(box(-118.6, y - 2.6, -113.4, y + 2.6));
      S.push(dash(-136, y + 0.5, 14, 2, 1.4));
      S.push(bold(-104, y + 2, [92, 78, 96, 70][k], 2, 1.8));
      S.push(ln(-104, y - 7, -104 + [124, 104, 118, 92][k], y - 7));
    });
    const x0 = 34;
    const x1 = 136;
    const y1 = 92;
    const rh = 15;
    S.push(box(x0, y1 - 4 * rh, x1, y1));
    for (let r = 1; r < 4; r++) S.push(ln(x0, y1 - r * rh, x1, y1 - r * rh));
    S.push(ln(x0 + 26, y1 - 3 * rh, x0 + 26, y1));
    [52, 40, 24].forEach((w, r) => {
      const y = y1 - r * rh - rh / 2;
      S.push(dash(x0 + 5, y, 16, 2, 1.3));
      S.push(ln(x0 + 32, y, x0 + 32 + w, y));
    });
    const ry = y1 - 3.5 * rh;
    S.push(bold(x0 + 6, ry + 1.8, 32, 2, 1.8));
    S.push(poly([x1 - 13, ry - 4], [x1 - 6, ry + 3]));
    S.push(poly([x1 - 11.5, ry + 3], [x1 - 6, ry + 3], [x1 - 6, ry - 2.5]));
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const bx = x0 + c * 35;
        const by = 12 - r * 16;
        S.push(box(bx, by - 11, bx + 32, by));
        S.push(ln(bx + 5, by - 5.5, bx + 5 + [18, 22, 14, 20, 16, 21][r * 3 + c], by - 5.5));
      }
    return S;
  },
  // 04 Contact: the routed brief, a square per row down its left margin, Rajat's row at the foot
  () => {
    const S: Stroke[] = [];
    const x0 = -132;
    const x1 = 132;
    S.push(box(x0, -50, x1, 92));
    S.push(ln(x0, 80, x1, 80));
    S.push(ln(x0 + 40, 80, x0 + 40, 92));
    S.push(ln(x1 - 40, 80, x1 - 40, 92));
    S.push(bold(x0 + 6, 88.5, 26, 3, 1.8));
    S.push(dash(x0 + 46, 86, 40, 2, 1.4));
    S.push(dash(x1 - 34, 86, 26, 2, 1.4));
    [62, 44, 6, -26].forEach((y) => S.push(ln(x0, y, x1, y)));
    const sx = x0 + 9;
    const my = [71, 53, 35, -4, -38];
    my.forEach((y, k) => {
      S.push(box(sx - 2.6, y - 2.6, sx + 2.6, y + 2.6));
      if (k < 4) S.push(ln(sx + 2.6, y, sx + 8, y));
      if (k < my.length - 1) S.push(vdash(sx, y - 2.6, my[k + 1] + 2.6));
    });
    [[71, 22], [53, 30], [35, 18], [-4, 20]].forEach(([y, w]) => S.push(dash(x0 + 22, y, w, 2, 1.3)));
    S.push(ln(x0 + 70, 71, x0 + 140, 71));
    S.push(ln(x0 + 70, 53, x0 + 162, 53));
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const bx = x0 + 70 + c * 63;
        const by = 40 - r * 16;
        S.push(box(bx, by - 12, bx + 60, by));
        S.push(ln(bx + 5, by - 6, bx + 5 + [34, 26, 28, 38, 30, 26][r * 3 + c], by - 6));
      }
    [-2, -10, -18].forEach((y) => S.push(ln(x0 + 70, y, x1 - 8, y)));
    S.push(bold(x0 + 20, -34, 30, 4, 1.9));
    S.push(dash(x1 - 70, -38, 48, 2, 1.3));
    S.push(poly([x1 - 16, -38], [x1 - 8, -38]));
    S.push(poly([x1 - 11, -35], [x1 - 8, -38], [x1 - 11, -41]));
    return S;
  },
];

// when the pen reaches each segment's ends, 0..1 across the whole drawing (constant pen speed, a beat per lift)
function timeline(S: Stroke[]) {
  const t: number[] = [];
  let acc = 0;
  let px: number | null = null;
  let py = 0;
  for (const stroke of S) {
    if (px !== null) acc += 8;
    for (const [x0, y0, x1, y1] of stroke) {
      if (px !== null) acc += Math.hypot(x0 - px, y0 - py) * 0.25;
      const l = Math.hypot(x1 - x0, y1 - y0);
      t.push(acc, acc + l);
      acc += l;
      px = x1;
      py = y1;
    }
  }
  return t.map((v) => v / acc);
}
const flat3 = (segs: Seg[], z: number) => segs.flatMap(([x0, y0, x1, y1]) => [x0, y0, z, x1, y1, z]);

// blue construction marks, shown while a sheet is marked out: registration corners, extension lines, a dimension line
function construction() {
  const s: Seg[] = [];
  const o = 7;
  const a = 15;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const x = sx * (BX + o);
      const y = sy * (BY + o);
      s.push([x, y, x - sx * a, y], [x, y, x, y - sy * a]);
    }
  s.push([-BX, BY + 5, -BX, BY + 36], [BX, BY + 5, BX, BY + 36]);
  s.push([-BX, BY + 28, BX, BY + 28]);
  s.push([-BX - 4, BY + 24, -BX + 4, BY + 32], [BX - 4, BY + 24, BX + 4, BY + 32]);
  return s;
}

// the arrangements: each sheet on a ring around the arc's centre, turned to face it; "you are here" in front
type Arrangement = { fov: number; pitch: number; hubZ: number; ring: [number, number][] };
const WIDE: Arrangement = { fov: 30, pitch: 20, hubZ: -2.6, ring: [[-37.5, 8.4], [-12.5, 8.4], [12.5, 8.4], [37.5, 8.4]] };
const NARROW: Arrangement = { fov: 40, pitch: 42, hubZ: -1.6, ring: [[-8, 14.4], [8, 14.4], [-17, 6.2], [17, 6.2]] };

type Dest = { num: string; heading: string; href: string; title: string; line: string };

export function SheetMap() {
  const router = useRouter();

  useEffect(() => {
    const sec = document.getElementById("map");
    if (!sec || reducedMotion() || !hasWebGL()) return;
    const map = sec;
    let teardown: (() => void) | undefined;
    let booting = false;
    let failed = false;
    let near = false;
    let far = false;
    let gone = false;

    // up once the map is within a screen and a half, down again four screens away; settled again after every change
    // (either observer can report first, and a boot can finish in between)
    function sync() {
      if (gone || failed || booting) return;
      if (far && teardown) {
        teardown();
        teardown = undefined;
      } else if (near && !far && !teardown) {
        booting = true;
        boot(map, (href) => router.push(href)).then(
          (c) => {
            booting = false;
            if (gone) return c();
            teardown = c;
            sync();
          },
          (err: unknown) => {
            booting = false;
            failed = true;
            console.log("[home] sheet map failed, the plain map stays: " + (err instanceof Error ? err.message : String(err)));
          }
        );
      }
    }
    const watch = (margin: string, set: (inside: boolean) => void) =>
      new IntersectionObserver(
        (es) => {
          set(es[es.length - 1].isIntersecting);
          sync();
        },
        { rootMargin: margin }
      );
    const nearIO = watch("150% 0px", (inside) => (near = inside));
    const farIO = watch("400% 0px", (inside) => (far = !inside));
    nearIO.observe(map);
    farIO.observe(map);
    return () => {
      gone = true;
      nearIO.disconnect();
      farIO.disconnect();
      teardown?.();
      teardown = undefined;
    };
  }, [router]);

  return null;
}

async function boot(sec: HTMLElement, go: (href: string) => void): Promise<() => void> {
  const need = (sel: string) => {
    const el = sec.querySelector<HTMLElement>(sel);
    if (!el) throw new Error(`the map's markup changed (${sel})`);
    return el;
  };
  const head = need(".sec-head");
  const root = need(".map-root");
  const list = need(".map-nodes");
  const items = Array.from(sec.querySelectorAll<HTMLElement>(".map-nodes > li"));
  const links = items.map((li) => li.querySelector<HTMLAnchorElement>("a.node")).filter((a): a is HTMLAnchorElement => !!a);
  if (items.length !== MINI.length || links.length !== MINI.length) throw new Error("the map's markup changed (four links)");
  const text = (a: HTMLElement, sel: string) => a.querySelector(sel)?.textContent?.trim() ?? "";
  // the copy, read from the plain map
  const DESTS: Dest[] = links.map((a) => {
    const [num = "", heading = ""] = text(a, ".node-top .lab").split(" · ");
    return { num, heading, href: a.getAttribute("href") ?? "/", title: text(a, ".node-t"), line: text(a, ".node-d") };
  });
  const N = DESTS.length;

  // in parallel: one round trip (three itself is usually cached already, by the stage)
  const [THREE, { LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }] = await Promise.all([
    import("three"),
    import("three/addons/lines/LineSegments2.js"),
    import("three/addons/lines/LineSegmentsGeometry.js"),
    import("three/addons/lines/LineMaterial.js"),
  ]);
  // the title blocks are canvas text: their faces first (capped, so a slow font never holds the drawing back)
  const css = getComputedStyle(document.documentElement);
  const mono = css.getPropertyValue("--font-mono").trim() || "monospace";
  const count = css.getPropertyValue("--font-count").trim() || mono;
  await Promise.race([
    Promise.all([`800 120px ${count}`, `500 42px ${mono}`, `400 30px ${mono}`].map((f) => document.fonts.load(f))).catch(() => {}),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  const canvas = document.createElement("canvas");
  canvas.className = "map-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" }); // throws without WebGL
  renderer.setClearColor(0xe7e9ec, 1);

  const COL = { ink: new THREE.Color(0x0d0f12), hair: new THREE.Color(0xc3c7ce), blue: new THREE.Color(0x2448ff), graphite: new THREE.Color(0x4f5560) };
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xe7e9ec, 10, 40);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  // drafting lines: screen-space widths (1–1.25 CSS px at any zoom or pixel ratio)
  const lineMats: LineMaterial[] = [];
  const lmat = (o: ConstructorParameters<typeof LineMaterial>[0]) => {
    const m = new LineMaterial({ linewidth: 1, transparent: true, depthWrite: false, ...o });
    lineMats.push(m);
    return m;
  };
  const fat = (pos: number[], mat: LineMaterial) => {
    const g = new LineSegmentsGeometry();
    g.setPositions(pos);
    const o = new LineSegments2(g, mat);
    o.renderOrder = 1;
    return o;
  };

  function tbTexture(d: Dest) {
    const PX = 6;
    const w = (TB.x1 - TB.x0) * PX;
    const h = (TB.y1 - TB.y0) * PX;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d")!;
    x.textBaseline = "middle";
    x.fillStyle = "#0D0F12";
    x.textAlign = "center";
    x.font = `800 ${21 * PX}px ${count}`;
    x.fillText(d.num, (TB.cell * PX) / 2, h / 2 + PX * 0.6);
    x.textAlign = "left";
    x.font = `500 ${7 * PX}px ${mono}`;
    if ("letterSpacing" in x) x.letterSpacing = `${Math.round(0.6 * PX)}px`;
    x.fillText(d.heading.toUpperCase(), (TB.cell + 6) * PX, h / 4 + PX * 0.4);
    x.fillStyle = "#4F5560";
    x.font = `400 ${5 * PX}px ${mono}`;
    x.fillText(`SHEET ${d.num} OF ${two(N)}`, (TB.cell + 6) * PX, (h * 3) / 4 + PX * 0.3);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  /* ---------- the four sheets, each with its callout and readout in a layer over the canvas ---------- */
  const layer = document.createElement("div");
  layer.className = "map-layer";
  layer.setAttribute("aria-hidden", "true");
  type Sheet = {
    li: HTMLElement;
    g: Group;
    paperMat: MeshBasicMaterial;
    borderMat: LineMaterial;
    tbMat: LineMaterial;
    txtMat: MeshBasicMaterial;
    ghost: LineSegments2;
    ghostMat: LineMaterial;
    inkMat: LineMaterial;
    con: LineSegments2;
    conMat: LineMaterial;
    co: HTMLElement;
    dim: HTMLElement;
    dimText: string;
    foot: Vector3;
    callout: Vector3;
    yaw0: number;
    lean0: number;
    hv: number;
    want: number;
    drawAt: number | null;
    p: number;
    mpos: Vector3;
    mquat: Quaternion;
  };
  // what a pointer hits: each sheet and the space above it, up to where its link hangs once it is marked out (a link
  // rises with its lifted sheet, and the pointer that marked it must not fall into the gap and drop it); never drawn
  const hitGeo = new THREE.PlaneGeometry(SW, SH + 54).translate(0, 27, 0);
  const hits: Mesh[] = [];
  const sheets: Sheet[] = DESTS.map((d, i) => {
    const g = new THREE.Group();
    g.scale.setScalar(U);
    scene.add(g);
    const paperMat = new THREE.MeshBasicMaterial({ color: 0xf6f7f8, transparent: true, fog: false });
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), paperMat));
    const hit = new THREE.Mesh(hitGeo);
    hit.visible = false;
    hit.userData.i = i;
    hits.push(hit);
    g.add(hit);
    const borderMat = lmat({ color: COL.hair.clone() });
    g.add(fat(flat3(box(-BX, -BY, BX, BY), 0.3), borderMat));
    const tbMat = lmat({ color: COL.ink.clone() });
    const my = (TB.y0 + TB.y1) / 2;
    g.add(fat(flat3([...box(TB.x0, TB.y0, TB.x1, TB.y1), ...ln(TB.x0 + TB.cell, TB.y0, TB.x0 + TB.cell, TB.y1), ...ln(TB.x0 + TB.cell, my, TB.x1, my)], 0.3), tbMat));
    const txtMat = new THREE.MeshBasicMaterial({ map: tbTexture(d), transparent: true, depthWrite: false, fog: false });
    const txt = new THREE.Mesh(new THREE.PlaneGeometry(TB.x1 - TB.x0, TB.y1 - TB.y0), txtMat);
    txt.position.set((TB.x0 + TB.x1) / 2, my, 0.2);
    txt.renderOrder = 1;
    g.add(txt);
    // the miniature: its segments carry the pen's time as their "line distance", so a dash as long as the
    // progress draws it on (LineMaterial's own dash test, no custom shader); a faint underlay shows under the pen
    const S = MINI[i]();
    const mg = new LineSegmentsGeometry();
    mg.setPositions(flat3(S.flat(), 0.4));
    const tbuf = new THREE.InstancedInterleavedBuffer(new Float32Array(timeline(S)), 2, 1);
    mg.setAttribute("instanceDistanceStart", new THREE.InterleavedBufferAttribute(tbuf, 1, 0));
    mg.setAttribute("instanceDistanceEnd", new THREE.InterleavedBufferAttribute(tbuf, 1, 1));
    const ghostMat = lmat({ color: COL.blue.clone(), opacity: 0.2 });
    const ghost = new LineSegments2(mg, ghostMat);
    ghost.renderOrder = 1;
    ghost.visible = false;
    g.add(ghost);
    const inkMat = lmat({ color: COL.blue.clone(), linewidth: 1.25, dashed: true, dashSize: 2, gapSize: 1000, opacity: 0.92 });
    const ink = new LineSegments2(mg, inkMat);
    ink.renderOrder = 1;
    g.add(ink);
    const conMat = lmat({ color: COL.blue.clone(), opacity: 0 });
    const con = fat(flat3(construction(), 0.45), conMat);
    con.visible = false;
    g.add(con);

    const co = document.createElement("span");
    co.className = "map-co";
    co.textContent = d.num;
    const dim = document.createElement("span");
    dim.className = "map-dim";
    layer.append(co, dim);
    return {
      li: items[i],
      g,
      paperMat,
      borderMat,
      tbMat,
      txtMat,
      ghost,
      ghostMat,
      inkMat,
      con,
      conMat,
      co,
      dim,
      dimText: "",
      foot: new THREE.Vector3(),
      callout: new THREE.Vector3(),
      yaw0: 0,
      lean0: 0.07,
      hv: 0,
      want: 0,
      drawAt: null,
      p: 2,
      mpos: new THREE.Vector3(),
      mquat: new THREE.Quaternion(),
    };
  });

  /* ---------- the drafting plane: registration marks, the ring, the footprints, the leaders, "you are here" ---------- */
  const markMat = lmat({ color: COL.hair.clone(), fog: true, transparent: false, depthWrite: true });
  {
    // far enough back that a dive, with the fog pushed away, never runs out of plane
    const G = 0.55;
    const A = 0.05;
    const pos: number[] = [];
    for (let i = -30; i <= 30; i++)
      for (let k = -90; k <= 14; k++) {
        const x = i * G;
        const z = k * G;
        pos.push(x - A, 0, z, x + A, 0, z, x, 0, z - A, x, 0, z + A);
      }
    const marks = fat(pos, markMat);
    marks.renderOrder = 0;
    scene.add(marks);
  }
  const groundMat = lmat({ vertexColors: true, color: new THREE.Color(1, 1, 1) });
  const ground = new LineSegments2(new LineSegmentsGeometry(), groundMat);
  ground.renderOrder = 1;
  scene.add(ground);
  const leaders = sheets.map(() => {
    const l = new LineSegments2(new LineSegmentsGeometry(), lmat({ color: COL.blue.clone(), dashed: true, dashSize: 0.09, gapSize: 0.07, opacity: 0.5 }));
    l.renderOrder = 1;
    scene.add(l);
    return l;
  });
  const hubMat = new THREE.MeshBasicMaterial({ color: 0xff4d12, fog: false, transparent: true });
  const hubSq = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hubMat);
  hubSq.rotation.x = -Math.PI / 2;
  scene.add(hubSq);
  // every program, off the main thread where the GPU allows, before the map shows: it boots while the chapters above
  // are still being scrolled, and a blocking compile would stall that scroll (capped, as a lost context never reports)
  await Promise.race([renderer.compileAsync(scene, camera), new Promise((r) => setTimeout(r, 3000))]);

  /* ---------- the hint (pointers) and the chooser that docks at a phone's foot ---------- */
  const hint = document.createElement("p");
  hint.className = "lab hint map-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.innerHTML = '<span class="fine">Point at a sheet · drag to look around</span><span class="coarse">Tap a sheet · drag sideways to look around</span>';
  const pick = document.createElement("div");
  pick.className = "map-pick";
  pick.setAttribute("aria-live", "polite");
  pick.innerHTML =
    '<p class="lab map-pick-hint">Tap a sheet to choose · drag sideways to look around</p>' +
    '<p class="lab map-pick-sel map-pick-lab"></p><p class="map-pick-sel map-pick-t"></p><p class="map-pick-sel map-pick-l"></p>' +
    '<button type="button" class="btn btn-ink map-pick-sel map-pick-go">Go →</button>';
  const pickLab = pick.querySelector<HTMLElement>(".map-pick-lab")!;
  const pickT = pick.querySelector<HTMLElement>(".map-pick-t")!;
  const pickL = pick.querySelector<HTMLElement>(".map-pick-l")!;
  const pickGo = pick.querySelector<HTMLButtonElement>(".map-pick-go")!;

  /* ---------- state ---------- */
  let W = 1;
  let H = 1;
  let narrow = false;
  let L = WIDE;
  const hub = new THREE.Vector3();
  const base = { T: new THREE.Vector3(), th: 0, ph: 0, d: 20, ox: 0, oy: 0, pos: new THREE.Vector3() };
  const mapPos = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  // map → in (the dive) → gone (the page is opening), or in → out (Esc) → map
  type State = "map" | "in" | "out" | "gone";
  let state: State = "map";
  const setState = (s: State) => {
    state = s;
    sec.dataset.warp = s;
  };
  let warpW = 0;
  const warp: { idx: number; end: ReturnType<typeof endPose> | null } = { idx: -1, end: null };
  const tw: { on: boolean; t0: number; dur: number; from: number; to: number; done: (() => void) | null } = { on: false, t0: 0, dur: 1, from: 0, to: 0, done: null };
  // the dive also scrolls the map square into the window, so the paper fills the screen and not just the section
  let align: { from: number; to: number } | null = null;
  let stuck = 0;
  let hoverIdx = -1;
  let focusIdx = -1;
  let selIdx = -1;
  let alive = 0;
  let lastActive = performance.now();
  let inView = true;
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const drag = { yaw: 0, pitch: 0, ty: 0, tp: 0 };
  let down: { id: number; x: number; y: number; type: string; moved: boolean; onCanvas: boolean; yaw: number; pitch: number } | null = null;
  let dragging = false;
  let suppressClick = false;
  let lastPointer = "mouse";

  const v1 = new THREE.Vector3();
  const px = (v: Vector3) => {
    v1.copy(v).project(camera);
    return { x: (v1.x + 1) * 0.5 * W, y: (1 - v1.y) * 0.5 * H };
  };
  function placeCam(T: Vector3, th: number, ph: number, d: number, ox: number, oy: number) {
    camera.position.set(T.x + d * Math.sin(th) * Math.cos(ph), T.y + d * Math.sin(ph), T.z + d * Math.cos(th) * Math.cos(ph));
    camera.lookAt(T);
    camera.updateMatrixWorld();
    if (ox || oy) camera.setViewOffset(W, H, ox, oy, W, H);
    else camera.clearViewOffset();
  }
  // a sheet's pose: on its ring, leaning back a touch; marked out, it lifts and turns part way to the camera
  const eul = new THREE.Euler(0, 0, 0, "YXZ");
  function pose(s: Sheet, hv: number, dy: number, dyaw: number, ref: Vector3, outPos: Vector3, outQuat: Quaternion) {
    const h2 = (SH * U) / 2;
    const yawFace = Math.atan2(ref.x - s.foot.x, ref.z - s.foot.z);
    const yaw = s.yaw0 + (yawFace - s.yaw0) * 0.4 * hv + dyaw;
    const by = FOOT + LIFT * hv + dy;
    const leanFace = Math.atan2(ref.y - (by + h2), Math.hypot(ref.x - s.foot.x, ref.z - s.foot.z));
    const lean = s.lean0 + (leanFace - s.lean0) * 0.4 * hv;
    const nx = Math.sin(yaw);
    const nz = Math.cos(yaw);
    outPos.set(s.foot.x - nx * h2 * Math.sin(lean), by + h2 * Math.cos(lean), s.foot.z - nz * h2 * Math.sin(lean));
    outQuat.setFromEuler(eul.set(-lean, yaw, 0, "YXZ"));
  }

  /* ---------- layout: arrange the set for the frame, then fit the camera so it sits under the heading ---------- */
  function layout() {
    W = Math.max(1, sec.clientWidth);
    H = Math.max(1, sec.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    lineMats.forEach((m) => m.resolution.set(W, H));
    narrow = W < 720 || W / H < 0.95;
    sec.classList.toggle("map-narrow", narrow);
    L = narrow ? NARROW : WIDE;
    camera.fov = L.fov;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();

    hub.set(0, 0, L.hubZ);
    const gcol: number[] = [];
    const gpos: number[] = [];
    const addSeg = (a: Vector3, b: Vector3, c: { r: number; g: number; b: number }) => {
      gpos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      gcol.push(c.r, c.g, c.b, c.r, c.g, c.b);
    };
    const rings = new Map<number, number[]>();
    sheets.forEach((s, i) => {
      const [a, r] = L.ring[i];
      s.foot.set(r * Math.sin(a * DEG), 0, -r * Math.cos(a * DEG));
      s.yaw0 = -a * DEG;
      const n = new THREE.Vector3(Math.sin(s.yaw0), 0, Math.cos(s.yaw0));
      const tx = new THREE.Vector3(n.z, 0, -n.x);
      s.callout.copy(s.foot).addScaledVector(n, 0.55);
      // its footprint on the plane, with a tick at each end
      const y = 0.004;
      const h = (SW * U) / 2;
      const p0 = s.foot.clone().addScaledVector(tx, -h).setY(y);
      const p1 = s.foot.clone().addScaledVector(tx, h).setY(y);
      addSeg(p0, p1, COL.graphite);
      for (const p of [p0, p1]) addSeg(p.clone().addScaledVector(n, -0.07), p.clone().addScaledVector(n, 0.07), COL.graphite);
      const ring = rings.get(r) ?? [];
      ring.push(a);
      rings.set(r, ring);
      // the leader: "you are here" to this sheet's foot
      const dir = s.foot.clone().sub(hub).setY(0).normalize();
      const from = hub.clone().addScaledVector(dir, 0.32);
      leaders[i].geometry.setPositions([from.x, 0.006, from.z, s.foot.x, 0.006, s.foot.z]);
      leaders[i].computeLineDistances();
    });
    // each ring the sheets stand on, as a hairline construction arc
    for (const [r, as] of rings) {
      const a0 = (Math.min(...as) - 14) * DEG;
      const a1 = (Math.max(...as) + 14) * DEG;
      const n = 48;
      for (let k = 0; k < n; k++) {
        const u0 = a0 + ((a1 - a0) * k) / n;
        const u1 = a0 + ((a1 - a0) * (k + 1)) / n;
        addSeg(new THREE.Vector3(r * Math.sin(u0), 0.003, -r * Math.cos(u0)), new THREE.Vector3(r * Math.sin(u1), 0.003, -r * Math.cos(u1)), COL.hair);
      }
    }
    ground.geometry.dispose();
    ground.geometry = new LineSegmentsGeometry();
    ground.geometry.setPositions(gpos);
    ground.geometry.setColors(gcol);

    // fit: everything that must show (sheets at rest and lifted, their dimension lines, callouts, the hub and its
    // note, and a marked-out sheet's link at its full height) inside the frame below the heading
    const headB = head.getBoundingClientRect().bottom - sec.getBoundingClientRect().top;
    const labH = Math.max(
      ...items.map((li) => {
        const more = li.querySelector<HTMLElement>(".node-more");
        return li.offsetHeight - (more?.offsetHeight ?? 0) + (more?.firstElementChild?.scrollHeight ?? 0);
      })
    );
    // (a phone keeps its foot for the chooser's hint; a chosen sheet's details dock over the "you are here" note)
    const safe = narrow ? { l: 12, r: W - 12, t: headB + 12, b: H - 90 } : { l: 56, r: W - 56, t: headB + 20, b: H - 64 };
    const meanZ = sheets.reduce((a, s) => a + s.foot.z, 0) / N;
    base.T.set(0, 1.0, (hub.z + meanZ) / 2);
    base.th = 0;
    base.ph = L.pitch * DEG;
    const pts: Vector3[] = [];
    const labs: Vector3[] = [];
    const q = new THREE.Quaternion();
    const c = new THREE.Vector3();
    const m = new THREE.Matrix4();
    const sc = new THREE.Vector3(U, U, U);
    let d = 20;
    let bb = { l: 0, r: 0, t: 0, b: 0 };
    for (let it = 0; it < 12; it++) {
      placeCam(base.T, base.th, base.ph, d, 0, 0);
      pts.length = 0;
      labs.length = 0;
      for (const s of sheets)
        for (const hv of [0, 1]) {
          pose(s, hv, 0, 0, camera.position, c, q);
          m.compose(c, q, sc);
          for (const [x, y] of [[-BX, -BY], [BX, -BY], [-BX, BY + 36], [BX, BY + 36]]) pts.push(new THREE.Vector3(x, y, 0).applyMatrix4(m));
          // where overlay() hangs the marked-out link (its foot on this line, labH tall)
          if (hv) for (const x of [-BX, BX]) labs.push(new THREE.Vector3(x, BY + 44, 0).applyMatrix4(m));
        }
      for (const s of sheets) pts.push(s.callout);
      const ps = [...pts.map(px), ...labs.map(px).map((p) => ({ x: p.x, y: p.y - labH }))];
      const hp = px(hub);
      if (narrow) ps.push({ x: hp.x - 110, y: hp.y + 66 }, { x: hp.x + 110, y: hp.y + 66 });
      else ps.push({ x: hp.x + 270, y: hp.y + 44 });
      bb = { l: Math.min(...ps.map((p) => p.x)), r: Math.max(...ps.map((p) => p.x)), t: Math.min(...ps.map((p) => p.y)), b: Math.max(...ps.map((p) => p.y)) };
      const k = Math.max((bb.r - bb.l) / (safe.r - safe.l), (bb.b - bb.t) / (safe.b - safe.t));
      d *= k;
      if (Math.abs(k - 1) < 0.002) break;
    }
    base.d = d;
    base.ox = (bb.l + bb.r) / 2 - (safe.l + safe.r) / 2;
    base.oy = (bb.t + bb.b) / 2 - (safe.t + safe.b) / 2;
    placeCam(base.T, base.th, base.ph, base.d, base.ox, base.oy);
    base.pos.copy(camera.position);
    // the orange square: 14px by 14px from the composed view, like the site's (its depth is stretched against the
    // plane's foreshortening, so it reads as the square and not a dash)
    const a = px(new THREE.Vector3(hub.x - 0.5, 0, hub.z));
    const b = px(new THREE.Vector3(hub.x + 0.5, 0, hub.z));
    const f = px(new THREE.Vector3(hub.x, 0, hub.z - 0.5));
    const n = px(new THREE.Vector3(hub.x, 0, hub.z + 0.5));
    hubSq.scale.set(14 / Math.max(1, b.x - a.x), 14 / Math.max(1, n.y - f.y), 1);
    hubSq.position.set(hub.x, 0.005, hub.z);
    if (warp.idx >= 0) warp.end = endPose(warp.idx);
  }

  /* ---------- the dive: the sheet squares up to the camera, which closes in until the paper covers the frame ---------- */
  function endPose(i: number) {
    const s = sheets[i];
    const h2 = (SH * U) / 2;
    const C = new THREE.Vector3(s.foot.x, FOOT + 0.32 + h2, s.foot.z);
    // in at the layout's own pitch, the sheet tilting back to meet it: a camera that levelled out would show a phone's
    // tall frame the empty plane above the sheet
    const psi = Math.atan2(base.pos.x - C.x, base.pos.z - C.z);
    const ph = L.pitch * DEG;
    const n = new THREE.Vector3(Math.sin(psi) * Math.cos(ph), Math.sin(ph), Math.cos(psi) * Math.cos(ph));
    const t = Math.tan((camera.fov * DEG) / 2);
    const d = Math.min(h2 / t, (SW * U) / 2 / (t * camera.aspect)) * 0.97;
    return { C, n, d, P: C.clone().addScaledVector(n, d), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-ph, psi, 0, "YXZ")) };
  }
  function tweenW(to: number, dur: number, done: (() => void) | null) {
    tw.on = true;
    tw.t0 = performance.now();
    tw.from = warpW;
    tw.to = to;
    tw.dur = dur;
    tw.done = done;
    kick();
  }
  function rest() {
    clearTimeout(stuck);
    tw.on = false;
    warpW = 0;
    warp.idx = -1;
    align = null;
    setState("map");
    kick();
  }
  function warpIn(i: number) {
    if (state !== "map" || i < 0) return;
    warp.idx = i;
    thunk();
    if (reducedMotion()) return leave(i);
    setState("in");
    warp.end = endPose(i);
    const top = sec.getBoundingClientRect().top - (document.getElementById("top")?.getBoundingClientRect().height ?? 0);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    align = { from: window.scrollY, to: clamp(window.scrollY + top, 0, max) };
    tweenW(1, DIVE_MS, null);
  }
  // the page opens: a route by the router (the dive holds its last frame until it arrives); the brief, on this page
  function leave(i: number) {
    const href = DESTS[i].href;
    setState("gone");
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView();
      go(href);
      rest(); // out of sight now: the map is at rest when it is scrolled back to
      return;
    }
    go(href);
    stuck = window.setTimeout(rest, 4000); // the navigation never came (a newer one, to this page): back to the map
  }
  function back() {
    if (state !== "in") return;
    setState("out");
    align = null;
    tweenW(0, Math.max(300, 1050 * warpW), () => {
      warp.idx = -1;
      setState("map");
    });
  }

  /* ---------- input: hover and focus mark a sheet out; click or Enter dives in; touch taps to choose ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function hitAt(cx: number, cy: number) {
    const r = sec.getBoundingClientRect();
    ndc.set(((cx - r.left) / W) * 2 - 1, -((cy - r.top) / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hits, false)[0];
    return h ? (h.object.userData.i as number) : -1;
  }
  const active = () => {
    lastActive = performance.now();
    kick();
  };
  function select(i: number) {
    selIdx = i;
    pick.classList.toggle("has", i >= 0);
    if (i >= 0) {
      const d = DESTS[i];
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = d.num;
      pickLab.replaceChildren(num, ` · ${d.heading}`);
      pickT.textContent = d.title;
      pickL.textContent = d.line;
    }
    kick();
  }

  const ac = new AbortController();
  const on = { signal: ac.signal };
  pickGo.addEventListener("click", () => warpIn(selIdx), on);
  links.forEach((a, i) => {
    a.addEventListener(
      "focus",
      () => {
        if (a.matches(":focus-visible")) focusIdx = i;
        active();
      },
      on
    );
    a.addEventListener(
      "blur",
      () => {
        if (focusIdx === i) focusIdx = -1;
        kick();
      },
      on
    );
    // the link's own click is the dive (Next's Link stands down for a prevented click); a new tab or window stays the link's
    a.addEventListener(
      "click",
      (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const type = (e as PointerEvent).pointerType || (e.detail ? lastPointer : "key");
        if (type === "touch" && selIdx !== i) select(i);
        else warpIn(i);
      },
      on
    );
  });

  sec.addEventListener(
    "pointerdown",
    (e) => {
      lastPointer = e.pointerType;
      if (state !== "map" || (e.target as Element).closest(".map-pick")) return;
      active();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType, moved: false, onCanvas: e.target === canvas, yaw: drag.ty, pitch: drag.tp };
      if (e.pointerType === "mouse" && e.target === canvas) canvas.setPointerCapture(e.pointerId);
    },
    on
  );
  sec.addEventListener(
    "pointermove",
    (e) => {
      if (state !== "map") return;
      const r = sec.getBoundingClientRect();
      if (e.pointerType === "mouse") {
        par.tx = clamp(((e.clientX - r.left) / W) * 2 - 1, -1, 1);
        par.ty = clamp(((e.clientY - r.top) / H) * 2 - 1, -1, 1);
        if (!down) {
          const a = (e.target as Element).closest("a.node");
          hoverIdx = a ? links.indexOf(a as HTMLAnchorElement) : e.target === canvas ? hitAt(e.clientX, e.clientY) : -1;
          sec.classList.toggle("over", hoverIdx >= 0);
        }
      }
      if (down && e.pointerId === down.id) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (!down.moved && Math.hypot(dx, dy) > 6) {
          // touch: a vertical move is the page scrolling (touch-action: pan-y), not a look
          if (down.type !== "mouse" && Math.abs(dy) > Math.abs(dx)) {
            down = null;
            return;
          }
          down.moved = true;
          dragging = true;
          sec.classList.add("dragging");
        }
        if (down.moved) {
          drag.ty = clamp(down.yaw - dx * 0.16 * DEG, -18 * DEG, 18 * DEG);
          if (down.type === "mouse") drag.tp = clamp(down.pitch + dy * 0.1 * DEG, -7 * DEG, 9 * DEG);
        }
      }
      active();
    },
    on
  );
  const up = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const d = down;
    down = null;
    if (d.moved) {
      // let go: the view springs back to the composed one
      dragging = false;
      sec.classList.remove("dragging");
      drag.ty = 0;
      drag.tp = 0;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      kick();
      return;
    }
    if (e.type !== "pointerup" || !d.onCanvas || state !== "map") return;
    const hit = hitAt(e.clientX, e.clientY);
    if (d.type === "mouse") warpIn(hit);
    else if (hit >= 0 && hit === selIdx) warpIn(hit);
    else select(hit);
  };
  sec.addEventListener("pointerup", up, on);
  sec.addEventListener("pointercancel", up, on);
  sec.addEventListener(
    "click",
    (e) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true, signal: ac.signal }
  );
  sec.addEventListener(
    "pointerleave",
    (e) => {
      if (e.pointerType !== "mouse") return;
      hoverIdx = -1;
      par.tx = par.ty = 0;
      sec.classList.remove("over");
      kick();
    },
    on
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape") return;
      if (state === "in") {
        e.preventDefault();
        back();
      } else if (state === "map" && selIdx >= 0) select(-1);
    },
    on
  );

  /* ---------- the frame: render on demand ---------- */
  let raf = 0;
  let last = performance.now();
  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const P1 = new THREE.Vector3();
  const P2 = new THREE.Vector3();
  function frame() {
    raf = 0;
    const now = performance.now(); // one clock for the frame, the tweens and the activity timer
    const dt = clamp((now - last) / 1000, 0.001, 0.1);
    last = now;
    if (!inView) return;
    const reduced = reducedMotion();
    let busy = false;

    if (tw.on) {
      const u = Math.min(1, (now - tw.t0) / tw.dur);
      warpW = tw.from + (tw.to - tw.from) * attack(u);
      busy = true;
      // the page takes over while the camera settles its last few percent
      if (state === "in" && u >= 0.72) leave(warp.idx);
      if (u >= 1) {
        tw.on = false;
        const f = tw.done;
        tw.done = null;
        f?.();
      }
    }
    const e = warpW;
    if (align && (state === "in" || state === "gone")) window.scrollTo(0, Math.round(align.from + (align.to - align.from) * e));

    // breathing while someone is here; still a few seconds after the last move
    const aliveT = !reduced && state === "map" && now - lastActive < 5000 ? 1 : 0;
    alive += (aliveT - alive) * (1 - Math.exp(-dt * 2));
    if (Math.abs(aliveT - alive) < 0.003) alive = aliveT;
    if (alive > 0) busy = true;

    if (state === "map") {
      const kp = 1 - Math.exp(-dt * 4);
      par.x += (par.tx * (reduced ? 0 : 1) - par.x) * kp;
      par.y += (par.ty * (reduced ? 0 : 1) - par.y) * kp;
      const kd = 1 - Math.exp(-dt * (dragging ? 14 : 3));
      drag.yaw += (drag.ty - drag.yaw) * kd;
      drag.pitch += (drag.tp - drag.pitch) * kd;
      if (Math.abs(par.x - par.tx) + Math.abs(par.y - par.ty) > 1e-4 && !reduced) busy = true;
      if (Math.abs(drag.yaw - drag.ty) + Math.abs(drag.pitch - drag.tp) > 1e-4) busy = true;
    }

    // which sheet is marked out: pointed at, else focused, else chosen (touch); frozen during a dive
    const hot = state === "map" ? (dragging ? -1 : hoverIdx >= 0 ? hoverIdx : focusIdx >= 0 ? focusIdx : selIdx) : null;
    sheets.forEach((s, i) => {
      if (hot !== null) {
        const want = i === hot ? 1 : 0;
        if (want === 1 && s.want === 0) {
          tick();
          if (!reduced) s.drawAt = now;
        }
        s.want = want;
      }
      if (reduced) s.hv = s.want;
      else {
        s.hv += (s.want - s.hv) * (1 - Math.exp(-dt * 12));
        if (Math.abs(s.want - s.hv) < 1e-3) s.hv = s.want;
        else busy = true;
      }
      if (s.drawAt !== null) {
        const p = (now - s.drawAt) / DRAW_MS;
        if (p >= 1) {
          s.drawAt = null;
          s.p = 2;
        } else {
          s.p = p;
          busy = true;
        }
      }
    });

    // the camera on the map: the composed view, a little pointer parallax, a drag's look-around
    const th = base.th + par.x * 2.2 * DEG + drag.yaw;
    const ph = base.ph - par.y * 1.1 * DEG + drag.pitch;
    mapPos.set(base.T.x + base.d * Math.sin(th) * Math.cos(ph), base.T.y + base.d * Math.sin(ph), base.T.z + base.d * Math.cos(th) * Math.cos(ph));
    sheets.forEach((s, i) => {
      const q = 1 - s.hv;
      const f = i * 1.7;
      pose(s, s.hv, 0.03 * alive * q * Math.sin(now / 1150 + f), 0.012 * alive * q * Math.sin(now / 1700 + f * 0.7), base.pos, s.mpos, s.mquat);
      s.g.position.copy(s.mpos);
      s.g.quaternion.copy(s.mquat);
    });
    camPos.copy(mapPos);
    look.copy(base.T);
    let ox = base.ox;
    let oy = base.oy;
    if (warp.idx >= 0 && e > 0 && warp.end) {
      // a curve that ends square on to the sheet; the sheet turns to meet it
      const E = warp.end;
      P2.copy(E.P).addScaledVector(E.n, E.d * 0.8);
      P1.copy(mapPos).lerp(P2, 0.35);
      const a = (1 - e) ** 3;
      const b = 3 * (1 - e) ** 2 * e;
      const c = 3 * (1 - e) * e * e;
      const d = e ** 3;
      camPos.set(0, 0, 0).addScaledVector(mapPos, a).addScaledVector(P1, b).addScaledVector(P2, c).addScaledVector(E.P, d);
      look.lerp(E.C, smooth(seg(e, 0, 0.6)));
      const k = 1 - smooth(seg(e, 0, 0.7));
      ox *= k;
      oy *= k;
      const s = sheets[warp.idx];
      const turn = smooth(seg(e, 0, 0.7));
      s.g.position.lerpVectors(s.mpos, E.C, turn);
      s.g.quaternion.slerpQuaternions(s.mquat, E.quat, turn);
    }
    camera.position.copy(camPos);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    if (Math.abs(ox) + Math.abs(oy) > 0.01) camera.setViewOffset(W, H, ox, oy, W, H);
    else camera.clearViewOffset();
    // the far plane fades into the ground; the dive pushes the fade away, so the plane stays drawn behind the sheet
    fog.near = base.d * 0.9 * (1 + 1.5 * e);
    fog.far = base.d * 1.9 * (1 + 1.5 * e);

    // materials: marked out = inked border and blue construction; the rest fade as the camera dives
    const others = 1 - seg(e, 0, 0.45);
    sheets.forEach((s, i) => {
      const f = warp.idx >= 0 && i !== warp.idx ? others : 1;
      s.g.visible = f > 0.002;
      s.paperMat.opacity = f;
      s.paperMat.depthWrite = f > 0.999;
      s.borderMat.color.copy(COL.hair).lerp(COL.ink, s.hv);
      s.borderMat.opacity = f;
      s.tbMat.opacity = f;
      s.txtMat.opacity = f;
      s.inkMat.opacity = 0.92 * f;
      s.inkMat.dashSize = s.p;
      s.ghost.visible = s.p < 1;
      s.ghostMat.opacity = 0.2 * f;
      s.conMat.opacity = s.hv * f * (1 - seg(e, 0, 0.3));
      s.con.visible = s.conMat.opacity > 0.002;
      const lo = (0.42 + 0.5 * s.hv) * (1 - seg(e, 0, 0.35));
      leaders[i].material.opacity = lo;
      leaders[i].visible = lo > 0.002;
    });
    groundMat.opacity = 1 - 0.6 * seg(e, 0, 0.5);
    // "you are here" belongs to the map: it goes with the leaders (its 14px stretch only holds from the map's view)
    hubMat.opacity = 1 - seg(e, 0, 0.35);
    hubSq.visible = hubMat.opacity > 0.002;

    renderer.render(scene, camera);
    overlay(e);
    if (busy) kick();
  }

  // the DOM over the drawing follows it: the links on the sheets' top edges, callouts at their feet, readouts on the
  // dimension lines, the "you are here" note beside the square
  function overlay(e: number) {
    const o = (1 - seg(e, 0, 0.16)).toFixed(3);
    for (const el of [head, list, root, layer, hint, pick]) el.style.opacity = o;
    if (narrow && selIdx >= 0) root.style.opacity = "0"; // under the docked details
    if (o === "0.000") return;
    const T = (el: HTMLElement, p: { x: number; y: number }) => (el.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`);
    sheets.forEach((s) => {
      // above the top edge's highest point, so a turned sheet's rising edge never runs into its label
      const gap = BY + 10 + 34 * s.hv;
      const tl = px(s.g.localToWorld(vA.set(-BX, gap, 0)));
      const tr = px(s.g.localToWorld(vB.set(BX, gap, 0)));
      T(s.li, { x: tl.x, y: Math.min(tl.y, tr.y) });
      s.li.classList.toggle("is-hot", s.want === 1);
      T(s.co, px(s.callout));
      s.co.classList.toggle("is-hot", s.want === 1);
      if (s.hv > 0.01) {
        const ps = [[-BX, -BY], [BX, -BY], [BX, BY], [-BX, BY]].map(([x, y]) => px(s.g.localToWorld(vB.set(x, y, 0))));
        const w = Math.round(Math.max(...ps.map((p) => p.x)) - Math.min(...ps.map((p) => p.x)));
        const h = Math.round(Math.max(...ps.map((p) => p.y)) - Math.min(...ps.map((p) => p.y)));
        const txt = `${w} × ${h} px`;
        if (txt !== s.dimText) s.dim.textContent = s.dimText = txt;
        T(s.dim, px(s.g.localToWorld(vC.set(0, BY + 28, 0))));
        s.dim.style.opacity = s.hv.toFixed(3);
      } else if (s.dim.style.opacity !== "0") s.dim.style.opacity = "0";
    });
    T(root, px(hub));
  }

  /* ---------- go ---------- */
  const io = new IntersectionObserver((es) => {
    inView = es[es.length - 1].isIntersecting;
    if (inView) {
      lastActive = performance.now();
      last = performance.now();
      kick();
    }
  });
  io.observe(sec);
  let rz = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(rz);
    rz = window.setTimeout(() => {
      layout();
      kick();
    }, 60);
  });

  // the links move with their sheets, which draw their own construction: the page's hover guides (construction.tsx)
  // would measure a link where it was, not where it goes
  const cons = links.map((a) => a.getAttribute("data-cons"));
  links.forEach((a) => a.removeAttribute("data-cons"));
  sec.prepend(canvas);
  sec.append(layer, hint, pick);
  sec.classList.add("map-3d");
  setState("map");
  layout();
  ro.observe(sec);
  kick();

  return () => {
    ac.abort();
    cancelAnimationFrame(raf);
    clearTimeout(rz);
    clearTimeout(stuck);
    io.disconnect();
    ro.disconnect();
    for (const el of [head, list, root, ...items]) {
      el.style.opacity = "";
      el.style.transform = "";
    }
    items.forEach((li) => li.classList.remove("is-hot"));
    links.forEach((a, i) => {
      const v = cons[i];
      if (v !== null) a.setAttribute("data-cons", v);
    });
    sec.classList.remove("map-3d", "map-narrow", "over", "dragging");
    delete sec.dataset.warp;
    canvas.remove();
    layer.remove();
    hint.remove();
    pick.remove();
    renderer.dispose();
    renderer.forceContextLoss(); // browsers cap live WebGL contexts; free this one
  };
}
