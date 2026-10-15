"use client";

/* ------------------------------------------------------------------
 * THE STAGE (BUILD-PLAN.md §0, item 1-2; P3b item 5). Port of the home
 * prototype's module script (design/drafted/home-prototype.html:966-1559),
 * Shards variant only (the name-style switcher is dropped). "Rajat." is cut
 * into pieces; each piece sits on its own line of sight from one station
 * point, so the pieces read as the name from that point only. Find it and
 * they lock and ink. Scrolling then tells how I help a business: scattered
 * parts, the view where they make sense, one system.
 *
 * The hero line hangs from the name's full stop as a drafting callout and
 * changes in each breather (the drift eases toward the view every 7.6 s).
 * The six blocks carry drafting icons and answer hover and tap.
 *
 * All of it is enhancement: without WebGL or under reduced motion the page
 * keeps the server-rendered NameMark and process copy (page.tsx). `three`
 * loads by dynamic import() in an effect at hydration (not part of the
 * initial JS), and never loads under reduced motion or without WebGL (D20).
 *
 * The name's own texture is rasterised from src/lib/name-outline.ts (a
 * Path2D), not canvas fillText (D21) — identical letterforms, no font-load
 * race. The business-card canvas text uses the real next/font family
 * resolved from --font-sans, after document.fonts.load.
 *
 * This component finds its DOM by id/class (same pattern as
 * construction.tsx's Guides/CursorReadout) rather than owning it — page.tsx
 * renders the full static `.exp` markup so the page is readable with no JS.
 * ------------------------------------------------------------------ */

import { useLayoutEffect } from "react";
import * as NameOutline from "@/lib/name-outline";
import { tick, thunk } from "@/lib/sound";
import { reducedMotion } from "@/lib/motion";

export function hasWebGL(): boolean {
  try {
    const gl = (document.createElement("canvas").getContext("webgl") || document.createElement("canvas").getContext("experimental-webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext(); // a probe only: don't hold a context slot
    return !!gl;
  } catch {
    return false;
  }
}

// Links between a business's six parts (`problems`, from HOME.problems: problem
// on a card's front, fix on its back).
const PAIRS: [number, number][] = [
  [0, 1],
  [0, 5],
  [1, 4],
  [2, 3],
  [3, 5],
  [4, 5],
];

// Icons drawn onto the six blocks, per problem (front) and per fix (back), in the order of HOME.problems; 24-unit
// boxes like the rest of the drafting icon set.
const PROB_ICONS = [
  "M3 6h18v12H3z M3 6l9 7 9-7", // orders arrive by email
  "M3 5h18v14H3z M3 10h18 M3 15h18 M9 5v14", // stock in a spreadsheet
  "M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16", // only a developer can update the site
  "M3 11h7v8H3z M4.5 11V8a2 2 0 0 1 4 0v3 M14 11h7v8h-7z M15.5 11V8a2 2 0 0 1 4 0v3", // a login for every tool
  "M5 3h10l4 4v14H5z M15 3v4h4 M8 12h8 M8 16h5", // reports built by hand
  "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z", // the same data in four places
];
const FIX_ICONS = [
  "M3 5h5v5H3z M16 14h5v5h-5z M8 7.5h4v9h4", // orders tracked end to end
  "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6 M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3", // one source
  "M3 5h18v14H3z M3 9h18 M9 17l6-6 2 2-6 6H9z", // a site your team edits
  "M7 11h10v9H7z M9 11V8a3 3 0 0 1 6 0v3 M12 14.5v2", // one login
  "M3 19h18 M3 15l4-5 4 3 3-6 3 4h4", // reports that build themselves
  "M4 4h16v16H4z M8 12l3 3 5-6", // data entered once
];

export function Stage({ problems, leads }: { problems: readonly { problem: string; fix: string }[]; leads: readonly string[] }) {
  // a layout effect: arriving by client navigation, it can still hide the plain layout before that first paint
  useLayoutEffect(() => {
    // html[data-boot] shows the name alone until the stage takes over (globals.css). The boot script sets it on a
    // first load; set here for a client navigation; cleared once the stage is up, or as soon as it can't be.
    const root = document.documentElement;
    const unboot = () => {
      delete root.dataset.boot;
    };
    if (reducedMotion() || !hasWebGL()) {
      unboot();
      return;
    }
    if (!location.hash && !root.hasAttribute("data-boot")) root.dataset.boot = ""; // keep the boot script's "splash"
    const cap = window.setTimeout(unboot, 8000); // a slow start shows the plain page rather than an endless splash

    let disposed = false;
    let teardown: (() => void) | undefined;

    function start() {
      boot()
        .then((c) => {
          if (!c) unboot();
          if (disposed) c?.();
          else teardown = c;
        })
        .catch((err: unknown) => {
          unboot();
          console.log("[home] stage failed, the page stays still: " + (err instanceof Error ? err.message : String(err)));
        });
    }

    async function boot(): Promise<(() => void) | undefined> {
      const expMaybe = document.getElementById("exp");
      const pinMaybe = expMaybe?.querySelector<HTMLElement>(".exp-pin");
      const hudMaybe = expMaybe?.querySelector<HTMLElement>(".hud");
      const hudRow1Maybe = document.getElementById("hudRow1");
      const hudRow2Maybe = document.getElementById("hudRow2");
      const hudBarMaybe = document.getElementById("hudBar");
      const liveMaybe = document.getElementById("hookLive");
      const alignBtnMaybe = document.getElementById("alignBtn") as HTMLButtonElement | null;
      const lockxMaybe = expMaybe?.querySelector<HTMLElement>(".lockx");
      const headerMaybe = document.querySelector<HTMLElement>(".top");
      if (
        !expMaybe ||
        !pinMaybe ||
        !hudMaybe ||
        !hudRow1Maybe ||
        !hudRow2Maybe ||
        !hudBarMaybe ||
        !liveMaybe ||
        !alignBtnMaybe ||
        !lockxMaybe ||
        !headerMaybe
      ) {
        return undefined;
      }
      // Re-bound as plain (non-optional) consts: a type TS can carry into the
      // closures below (layout/update/frameLoop/event handlers) without
      // re-deriving narrowing through the optional chains above.
      const exp = expMaybe;
      const pin = pinMaybe;
      const hud = hudMaybe;
      const hudRow1 = hudRow1Maybe;
      const hudRow2 = hudRow2Maybe;
      const hudBar = hudBarMaybe;
      const live = liveMaybe;
      const alignBtn = alignBtnMaybe;
      const lockx = lockxMaybe;
      const header = headerMaybe;

      // in parallel: one round trip, not two
      const [THREE, { CSS2DRenderer, CSS2DObject }] = await Promise.all([import("three"), import("three/addons/renderers/CSS2DRenderer.js")]);
      if (disposed) return undefined;

      // Created here, not by page.tsx: no-JS, reduced-motion and no-WebGL
      // contexts never get a <canvas> in the DOM at all.
      const canvas = document.createElement("canvas");
      canvas.className = "exp-canvas";
      canvas.setAttribute("aria-hidden", "true");
      pin.insertBefore(canvas, pin.firstChild);

      const fine = matchMedia("(pointer: fine)").matches;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
      } catch (err) {
        console.log("[home] no WebGL, the page stays still: " + (err instanceof Error ? err.message : String(err)));
        return undefined;
      }

      const INK = new THREE.Color("#0D0F12");
      const BLUE = new THREE.Color("#2448FF");
      const ORANGE = new THREE.Color("#FF4D12");

      const T = (n: number) => n * 4 * 500;
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
      const weight = bez(0.7, 0, 0.2, 1);
      const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
      const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
      const STAG = 0.3;
      const local = (u: number, r: number, n: number) => weight(seg(u, (r / n) * STAG, (r / n) * STAG + 1 - STAG));
      let seed = 20261013;
      const rand = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const depths = (n: number) => {
        const ks = Array.from({ length: n }, (_, i) => 0.48 + 1.18 * (i + 0.2 + rand() * 0.6) / n);
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [ks[i], ks[j]] = [ks[j], ks[i]];
        }
        return ks;
      };
      const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

      renderer.setClearColor(0x000000, 0);
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.domElement.className = "exp-labels";
      labelRenderer.domElement.setAttribute("aria-hidden", "true");
      const uiEl = pin.querySelector(".exp-ui");
      pin.insertBefore(labelRenderer.domElement, uiEl);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 10, 60000);
      const lineMat = (opacity: number, dashed?: boolean, color?: InstanceType<typeof THREE.Color>) =>
        dashed
          ? new THREE.LineDashedMaterial({ color: color ?? BLUE, dashSize: 6, gapSize: 5, transparent: true, opacity, depthWrite: false })
          : new THREE.LineBasicMaterial({ color: color ?? BLUE, transparent: true, opacity, depthWrite: false });
      const QI = new THREE.Quaternion();

      /* 1. the name: cut into shards from the generated outline (D21) — no
         canvas fillText, no font-load race. */
      type Piece = {
        c: InstanceType<typeof THREE.Vector3>;
        k: number;
        mesh: InstanceType<typeof THREE.Mesh> | null;
        edge: InstanceType<typeof THREE.LineSegments> | null;
        rank: number;
      };
      const WORLD_NAME_W = 340; // world units the whole name (incl. the dot) spans
      let parts: Piece[] = [];
      let nameH = 100;
      let dotHalf = 0; // world units: half the orange square, and its centre down to the j's descender (the callout)
      let dotDrop = 0;
      let projPos = new Float32Array(0);
      const projGeo = new THREE.BufferGeometry();
      const projectors = new THREE.LineSegments(projGeo, lineMat(0));
      projectors.frustumCulled = false;
      scene.add(projectors);

      function buildName() {
        const PADU = Math.round(NameOutline.NAME_UNITS_PER_EM * 0.03);
        const TOTAL_W = NameOutline.NAME_VIEW_W + PADU * 2;
        const TOTAL_H = NameOutline.NAME_VIEW_H + PADU * 2;
        const TPX = 0.5; // texture px per font unit — resolution, not geometry
        const TW = Math.max(1, Math.round(TOTAL_W * TPX));
        const TH = Math.max(1, Math.round(TOTAL_H * TPX));
        const tc = document.createElement("canvas");
        tc.width = TW;
        tc.height = TH;
        const tx = tc.getContext("2d")!;
        tx.save();
        tx.translate(PADU * TPX, PADU * TPX);
        tx.scale(TPX, TPX);
        tx.fillStyle = "#fff";
        tx.fill(new Path2D(NameOutline.NAME_PATH));
        tx.restore();
        const ink = tx.getImageData(0, 0, TW, TH).data;
        const alphaAt = (xu: number, yu: number) => {
          const px = Math.min(TW - 1, Math.max(0, Math.round((xu + PADU) * TPX)));
          const py = Math.min(TH - 1, Math.max(0, Math.round((yu + PADU) * TPX)));
          return ink[(py * TW + px) * 4 + 3];
        };
        const inkedRect = (x0: number, y0: number, x1: number, y1: number) => {
          for (let a = 0; a < 6; a++)
            for (let b = 0; b < 6; b++) {
              if (alphaAt(x0 + ((x1 - x0) * (a + 0.5)) / 6, y0 + ((y1 - y0) * (b + 0.5)) / 6) > 60) return true;
            }
          return false;
        };

        const U = WORLD_NAME_W / TOTAL_W;
        nameH = NameOutline.NAME_VIEW_H * U;
        dotHalf = (NameOutline.NAME_DOT / 2) * U;
        dotDrop = (NameOutline.NAME_VIEW_H - NameOutline.NAME_CAP + NameOutline.NAME_DOT / 2) * U;
        const cxu = NameOutline.NAME_VIEW_W / 2;
        const cyu = NameOutline.NAME_VIEW_H / 2;
        const wpt = (xu: number, yu: number) => V((xu - cxu) * U, -(yu - cyu) * U, 0);
        const uvX = (xu: number) => (xu + PADU) / TOTAL_W;
        const uvY = (yu: number) => (yu + PADU) / TOTAL_H;
        const tex = new THREE.CanvasTexture(tc);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

        const rectPiece = (x0: number, y0: number, x1: number, y1: number) => {
          const g = new THREE.PlaneGeometry((x1 - x0) * U, (y1 - y0) * U);
          const uv = g.attributes.uv;
          uv.setXY(0, uvX(x0), 1 - uvY(y0));
          uv.setXY(1, uvX(x1), 1 - uvY(y0));
          uv.setXY(2, uvX(x0), 1 - uvY(y1));
          uv.setXY(3, uvX(x1), 1 - uvY(y1));
          return { g, c: wpt((x0 + x1) / 2, (y0 + y1) / 2) };
        };

        // a drawing sheet cut into jittered columns, each column into 3-5 rows
        const X0 = 0;
        const X1 = NameOutline.NAME_RUN;
        const Y0 = 0;
        const Y1 = NameOutline.NAME_VIEW_H;
        const COLS = 9;
        const xs = [X0];
        for (let i = 1; i < COLS; i++) xs.push(Math.round(X0 + ((X1 - X0) * (i + (rand() - 0.5) * 0.6)) / COLS));
        xs.push(X1);
        const cuts: ReturnType<typeof rectPiece>[] = [];
        for (let c = 0; c < COLS; c++) {
          const rows = 3 + Math.floor(rand() * 3);
          const ys = [Y0];
          for (let j = 1; j < rows; j++) ys.push(Math.round(Y0 + ((Y1 - Y0) * (j + (rand() - 0.5) * 0.7)) / rows));
          ys.push(Y1);
          for (let j = 0; j < rows; j++) if (inkedRect(xs[c], ys[j], xs[c + 1], ys[j + 1])) cuts.push(rectPiece(xs[c], ys[j], xs[c + 1], ys[j + 1]));
        }

        const piece = (c: InstanceType<typeof THREE.Vector3>, k: number, mesh: InstanceType<typeof THREE.Mesh> | null, edge: InstanceType<typeof THREE.LineSegments> | null): Piece => ({
          c,
          k,
          mesh,
          edge,
          rank: 0,
        });

        const ks = depths(cuts.length + 1);
        const list: Piece[] = [];
        // forceSinglePass: a flat piece can't overlap itself, so one pass draws the same pixels as three's
        // back-then-front pass for transparent DoubleSide, at half the draws and without re-resolving the
        // program twice a frame (that pass flips material.side and sets needsUpdate).
        cuts.forEach((pc, i) => {
          const mesh = new THREE.Mesh(pc.g, new THREE.MeshBasicMaterial({ map: tex, color: BLUE.clone(), transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }));
          const edge = new THREE.LineSegments(new THREE.EdgesGeometry(pc.g), lineMat(0.3));
          mesh.add(edge);
          scene.add(mesh);
          list.push(piece(pc.c, ks[i], mesh, edge));
        });

        // the orange square: the full stop
        const dm = new THREE.Mesh(
          new THREE.PlaneGeometry(NameOutline.NAME_DOT * U, NameOutline.NAME_DOT * U),
          new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, side: THREE.DoubleSide, forceSinglePass: true })
        );
        scene.add(dm);
        list.push(piece(wpt(NameOutline.NAME_RUN + NameOutline.NAME_GAP + NameOutline.NAME_DOT / 2, NameOutline.NAME_CAP - NameOutline.NAME_DOT / 2), ks[ks.length - 1], dm, null));

        list
          .slice()
          .sort((a, b) => a.c.x - b.c.x)
          .forEach((p, r) => {
            p.rank = r;
          });
        parts = list;
        projPos = new Float32Array(parts.length * 6);
        projGeo.setAttribute("position", new THREE.BufferAttribute(projPos, 3));
      }

      /* 2. a business's parts: each card is drawn to a canvas (problem on
         its front, fix on its back) and cut into shards like the name. */
      const TWd = 196;
      const THd = 68;
      const GAP = 24;
      const CPX = 3;
      const rootStyle = getComputedStyle(document.documentElement);
      const sansFamily = rootStyle.getPropertyValue("--font-sans").trim() || "sans-serif";
      const monoFamily = rootStyle.getPropertyValue("--font-mono").trim() || "monospace";
      const cardFont = `500 ${14 * CPX}px ${sansFamily}`;
      const monoFont = `500 ${8 * CPX}px ${monoFamily}`;
      await Promise.race([
        Promise.all([document.fonts.load(cardFont), document.fonts.load(monoFont)]).catch(() => {}),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
      if (disposed) {
        renderer.dispose();
        canvas.remove();
        return undefined;
      }
      const wrapText = (x: CanvasRenderingContext2D, text: string, maxW: number) => {
        const lines: string[] = [];
        let line = "";
        text.split(" ").forEach((w) => {
          const t = line ? line + " " + w : w;
          if (x.measureText(t).width > maxW && line) {
            lines.push(line);
            line = w;
          } else line = t;
        });
        if (line) lines.push(line);
        return lines;
      };
      const faceTex: InstanceType<typeof THREE.CanvasTexture>[] = [];
      // A block's face: a drafting icon (drawn on as `p` goes 0 → 1), its text beside it, and in the corner the
      // part number (problem side) or an orange done-mark (fix side).
      type Face = { c: HTMLCanvasElement; x: CanvasRenderingContext2D; t: InstanceType<typeof THREE.CanvasTexture>; text: string; ink: boolean; icon: Path2D; num: string; p: number };
      const strokeIcon = (x: CanvasRenderingContext2D, f: Face, ox: number, oy: number) => {
        if (f.p <= 0) return;
        x.save();
        x.translate(ox * CPX, oy * CPX);
        x.scale(CPX, CPX);
        x.strokeStyle = f.ink ? "#0D0F12" : "#2448FF";
        x.lineWidth = 1.5;
        x.lineCap = "square";
        x.setLineDash([160, 160]);
        x.lineDashOffset = 160 * (1 - f.p);
        x.stroke(f.icon);
        x.restore();
      };
      const paint = (f: Face) => {
        const { c, x } = f;
        const col = f.ink ? "#0D0F12" : "#2448FF";
        x.fillStyle = "#F6F7F8";
        x.fillRect(0, 0, c.width, c.height);
        x.strokeStyle = col;
        x.lineWidth = CPX;
        x.strokeRect(CPX / 2, CPX / 2, c.width - CPX, c.height - CPX);
        if (f.ink) {
          x.fillStyle = "#FF4D12";
          x.fillRect(c.width - 13 * CPX, 7 * CPX, 6 * CPX, 6 * CPX);
        } else {
          x.fillStyle = "#4F5560";
          x.font = monoFont;
          x.textAlign = "right";
          x.textBaseline = "top";
          x.fillText(f.num, c.width - 7 * CPX, 6 * CPX);
        }
        strokeIcon(x, f, 12, THd / 2 - 12);
        x.fillStyle = col;
        x.font = cardFont;
        x.textAlign = "left";
        x.textBaseline = "middle";
        const lines = wrapText(x, f.text, c.width - 60 * CPX);
        const lh = 16.5 * CPX;
        lines.forEach((l, k) => x.fillText(l, 46 * CPX, c.height / 2 + (k - (lines.length - 1) / 2) * lh));
        f.t.needsUpdate = true;
      };
      // A draw-on step repaints only the icon's box (units) on a small canvas and copies it into that region of the
      // face's texture: re-uploading whole faces (with mipmaps) while scrolling cost frames.
      const IB = { x: 11, y: THd / 2 - 13, s: 26 };
      const ibCan = document.createElement("canvas");
      ibCan.width = ibCan.height = IB.s * CPX;
      const ibX = ibCan.getContext("2d")!;
      const ibSrc = new THREE.Texture(ibCan); // never rendered: copyTextureToTexture uploads its canvas straight into a face
      const ibAt = new THREE.Vector2(IB.x * CPX, (THd - IB.y - IB.s) * CPX); // texture rows run bottom-up (flipY)
      const drawOn = (f: Face, p: number) => {
        f.p = p;
        ibX.fillStyle = "#F6F7F8";
        ibX.fillRect(0, 0, ibCan.width, ibCan.height);
        strokeIcon(ibX, f, 12 - IB.x, THd / 2 - 12 - IB.y);
        f.x.drawImage(ibCan, IB.x * CPX, IB.y * CPX); // keep the face canvas whole: a restored context re-uploads it
        renderer.copyTextureToTexture(ibSrc, f.t, null, ibAt);
      };
      const face = (text: string, ink: boolean, icon: string, num: string): Face => {
        const c = document.createElement("canvas");
        c.width = TWd * CPX;
        c.height = THd * CPX;
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        faceTex.push(t);
        const f: Face = { c, x: c.getContext("2d")!, t, text, ink, icon: new Path2D(icon), num, p: 0 };
        paint(f);
        return f;
      };
      type Shard = {
        pivot: InstanceType<typeof THREE.Object3D>;
        fm: InstanceType<typeof THREE.Mesh>;
        bm: InstanceType<typeof THREE.Mesh>;
        edge: InstanceType<typeof THREE.LineSegments>;
        lx: number;
        ly: number;
        k: number;
        rank: number;
        G: InstanceType<typeof THREE.Vector3>;
        S: InstanceType<typeof THREE.Vector3>;
        ci: number;
      };
      const meshCard = new Map<object, number>(); // a block's meshes → its index, for picking
      // registration marks at a block's corners, shown while it is hovered or tapped
      const cornerGeo = (() => {
        const a = 9;
        const ox = TWd / 2 + 7;
        const oy = THd / 2 + 7;
        const pts: InstanceType<typeof THREE.Vector3>[] = [];
        for (const sx of [-1, 1])
          for (const sy of [-1, 1]) pts.push(V(sx * ox, sy * oy, 0), V(sx * (ox - a), sy * oy, 0), V(sx * ox, sy * oy, 0), V(sx * ox, sy * (oy - a), 0));
        return new THREE.BufferGeometry().setFromPoints(pts);
      })();
      const cards = problems.map(({ problem, fix }, ci) => {
        const frontFace = face(problem, false, PROB_ICONS[ci] ?? "", `0${ci + 1}`);
        const backFace = face(fix, true, FIX_ICONS[ci] ?? "", "");
        const front = frontFace.t;
        const back = backFace.t;
        const marks = new THREE.LineSegments(cornerGeo, new THREE.LineBasicMaterial({ color: BLUE.clone(), transparent: true, opacity: 0, depthWrite: false }));
        marks.visible = false;
        scene.add(marks);
        const peekEl = document.createElement("div");
        peekEl.className = "d3-peek";
        peekEl.style.opacity = "0";
        const peek = new CSS2DObject(peekEl);
        peek.center.set(0, 0);
        scene.add(peek);
        const shards: Shard[] = [];
        const xs = [0, Math.round((TWd * (1 + (rand() - 0.5) * 0.5)) / 3), Math.round((TWd * (2 + (rand() - 0.5) * 0.5)) / 3), TWd];
        const ys = [0, Math.round(THd * (0.5 + (rand() - 0.5) * 0.4)), THd];
        for (let i = 0; i < 3; i++)
          for (let j = 0; j < 2; j++) {
            const x0 = xs[i];
            const x1 = xs[i + 1];
            const y0 = ys[j];
            const y1 = ys[j + 1];
            const cut = () => {
              const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
              const a = g.attributes.uv;
              a.setXY(0, x0 / TWd, 1 - y0 / THd);
              a.setXY(1, x1 / TWd, 1 - y0 / THd);
              a.setXY(2, x0 / TWd, 1 - y1 / THd);
              a.setXY(3, x1 / TWd, 1 - y1 / THd);
              return g;
            };
            const pivot = new THREE.Object3D();
            const fm = new THREE.Mesh(cut(), new THREE.MeshBasicMaterial({ map: front, transparent: true, opacity: 0, depthWrite: false }));
            const bm = new THREE.Mesh(cut(), new THREE.MeshBasicMaterial({ map: back, transparent: true, opacity: 0, depthWrite: false }));
            bm.rotation.y = Math.PI;
            const edge = new THREE.LineSegments(new THREE.EdgesGeometry(fm.geometry), new THREE.LineBasicMaterial({ color: BLUE.clone(), transparent: true, opacity: 0, depthWrite: false }));
            pivot.add(fm, bm, edge);
            scene.add(pivot);
            meshCard.set(fm, ci);
            meshCard.set(bm, ci);
            shards.push({ pivot, fm, bm, edge, lx: (x0 + x1) / 2 - TWd / 2, ly: THd / 2 - (y0 + y1) / 2, k: 1, rank: 0, G: V(0, 0, 0), S: V(0, 0, 0), ci });
          }
        return { shards, G: V(0, 0, 0), solved: false, problem, fix, frontFace, backFace, marks, peek, peekEl, peekText: "", hv: 0, last: 0 };
      });
      const allShards = cards.flatMap((c) => c.shards);
      const cks = depths(allShards.length);
      allShards.forEach((s, i) => {
        s.k = cks[i];
        s.rank = i;
      });
      cards.forEach((cd) => (cd.last = cd.shards[cd.shards.length - 1].rank));
      const linkPos = new Float32Array(PAIRS.length * 6);
      const linkGeo = new THREE.BufferGeometry();
      linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
      const links = new THREE.LineSegments(linkGeo, lineMat(0, true));
      const frameGeo = new THREE.BufferGeometry();
      const frame = new THREE.LineSegments(frameGeo, lineMat(0, false, INK));
      const sysEl = document.createElement("div");
      sysEl.className = "d3-note";
      sysEl.textContent = "One system";
      const sys = new CSS2DObject(sysEl);
      sys.center.set(0, 1);
      [links, frame].forEach((o) => {
        o.frustumCulled = false;
        scene.add(o);
      });
      scene.add(sys);

      // the hero line as a drafting callout hung from the name's orange dot, following its drift (the page's own
      // .lead stays for screen readers); it changes in each breather
      const calloutEl = document.createElement("div");
      calloutEl.className = "d3-callout";
      calloutEl.innerHTML = '<i class="ldr"></i><div class="box"><span class="no"></span><p></p></div>';
      const calloutNo = calloutEl.querySelector(".no")!;
      const calloutP = calloutEl.querySelector("p")!;
      const callout = new CSS2DObject(calloutEl);
      callout.center.set(0, 0);
      scene.add(callout);
      let leadIdx = -1;
      const showLead = (i: number) => {
        leadIdx = i;
        const span = document.createElement("span");
        span.textContent = leads[i] ?? "";
        calloutP.replaceChildren(span);
        calloutP.classList.remove("swap");
        void calloutP.offsetWidth;
        calloutP.classList.add("swap");
        calloutNo.textContent = `0${i + 1} / 0${leads.length}`;
      };

      /* state */
      let Dn = 1000;
      let Dt = 1000;
      let W = 1;
      let H = 1;
      let topH = 61;
      let mode: "idle" | "play" | "locked" = "idle";
      let input: "drift" | "mouse" | "touch" | "key" = "drift";
      let moved = false;
      let px = 0.5;
      let py = 0.5;
      // The hand-off (BUILD-PLAN §0 item 1: "takes over aligned, then breaks"): the first frame matches the static
      // name exactly — aligned, ink, and at its size and place via camera zoom + view offset (the station point
      // can't move without breaking the alignment) — then over ~1s it eases to the design size, drifts apart and
      // turns blue.
      let th = 0;
      let ph = 0;
      let introAt: number | null = null;
      let intro = 1; // 1 → 0 over the hand-off
      const driftTh = (now: number) => 16 + 6 * Math.sin(now / 2600);
      const driftPh = (now: number) => -7 + 3 * Math.sin(now / 3700);
      let introZoom = 1;
      let introDy = 0;
      let thT = th;
      let phT = ph;
      let parT = 0;
      let parP = 0;
      let tween: { t0: number; dur: number; th0: number; ph0: number; ease: (t: number) => number } | null = null;
      let lockAt: number | null = null;
      let playAt = 0;
      let inkDone = false;
      let sS = 0;
      let step = 0;
      let cons = document.documentElement.dataset.construction === "on";
      let dirty = true;
      let visible = true;
      let hudKey = "";

      function layout() {
        topH = Math.round(header.getBoundingClientRect().height);
        document.documentElement.style.setProperty("--top-h", topH + "px");
        W = pin.clientWidth;
        H = pin.clientHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(W, H, false);
        labelRenderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        const tan = Math.tan((camera.fov * Math.PI) / 360);
        const narrow = W < 640;
        Dn = Math.max(WORLD_NAME_W / (narrow ? 0.88 : 0.64) / (2 * tan * camera.aspect), nameH / 0.42 / (2 * tan));
        // the static name: `.fallback-name img` is min(92%, 46rem) wide and centred above a 10%-of-width padding
        const svgPx = Math.min(W * 0.92, 46 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16));
        const nameWorldW = (WORLD_NAME_W * NameOutline.NAME_VIEW_W) / (NameOutline.NAME_VIEW_W + 2 * Math.round(NameOutline.NAME_UNITS_PER_EM * 0.03));
        introZoom = svgPx / ((nameWorldW * W) / (2 * tan * camera.aspect * Dn));
        introDy = 0.05 * W;
        // the callout's leader leaves the dot's edge and its note clears the j's descender, at any size
        const pxU = H / (2 * tan * Dn);
        calloutEl.style.setProperty("--half", (dotHalf * pxU).toFixed(1) + "px");
        calloutEl.style.setProperty("--drop", (dotDrop * pxU).toFixed(1) + "px");
        const cols = narrow ? 2 : 3;
        const rows = problems.length / cols;
        const gw = cols * TWd + (cols - 1) * GAP;
        const gh = rows * THd + (rows - 1) * GAP;
        Dt = Math.max(gw / (narrow ? 0.9 : 0.62) / (2 * tan * camera.aspect), gh / 0.46 / (2 * tan));
        const yo = Dt * tan * 0.14;
        cards.forEach((cd, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          cd.G.set(-gw / 2 + TWd / 2 + c * (TWd + GAP), gh / 2 - THd / 2 - r * (THd + GAP) + yo, 0);
          cd.shards.forEach((s) => {
            s.G.set(cd.G.x + s.lx, cd.G.y + s.ly, 0);
            s.S.set(s.G.x * s.k, s.G.y * s.k, Dt * (1 - s.k));
          });
          cd.peek.center.set(cd.G.x > 1 ? 1 : 0, 0); // right-hand blocks hang their peek leftwards, so it stays on screen
        });
        const fx = gw / 2 + 22;
        const f0 = -gh / 2 - 22 + yo;
        const f1 = gh / 2 + 22 + yo;
        frameGeo.setFromPoints([V(-fx, f0, 0), V(fx, f0, 0), V(fx, f0, 0), V(fx, f1, 0), V(fx, f1, 0), V(-fx, f1, 0), V(-fx, f1, 0), V(-fx, f0, 0)]);
        // on a phone the frame runs to the screen's edges: centre its label so it isn't cut off
        sys.center.set(narrow ? 0.5 : 0, 1);
        sys.position.set(narrow ? 0 : -fx, f1 + 8, 0);
        dirty = true;
      }

      /* input: the pointer over the pieces (mouse), a sideways drag (touch), the arrow keys */
      const begin = (kind: typeof input) => {
        if (mode === "locked" || tween) return;
        if (input !== kind) {
          input = kind;
          playAt = performance.now();
          if (kind !== "mouse") {
            // taking over mid hand-off: start from where the drift is heading, not from the aligned pose
            const now = performance.now();
            thT = intro > 0 ? driftTh(now) : th;
            phT = intro > 0 ? driftPh(now) : ph;
          }
        }
        mode = "play";
      };
      const onPinPointerMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = pin.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        moved = true;
        pointerIn = true;
        begin("mouse");
        dirty = true;
      };
      let dragX: number | null = null;
      const onCanvasPointerDown = (e: PointerEvent) => {
        if (e.pointerType !== "touch" || mode === "locked" || step) return;
        dragX = e.clientX;
        begin("touch");
      };
      const onWinPointerMove = (e: PointerEvent) => {
        if (dragX === null || e.pointerType !== "touch") return;
        thT = clamp(thT - (e.clientX - dragX) * 0.22, -55, 55);
        dragX = e.clientX;
        dirty = true;
      };
      const endDrag = () => {
        dragX = null;
      };
      const onPinKeyDown = (e: KeyboardEvent) => {
        if (step || mode === "locked") return;
        const k = ({ ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, 3], ArrowDown: [0, -3] } as Record<string, [number, number]>)[e.key];
        if (k) {
          e.preventDefault();
          begin("key");
          thT = clamp(thT + k[0], -55, 55);
          phT = clamp(phT + k[1], -30, 30);
          dirty = true;
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          lineUp(false);
        }
      };
      const onAlignClick = () => lineUp(false);

      // hover a block (fine pointers), or tap/click it to pin it: picked by a ray through the pointer
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let pointerIn = false;
      let tapCard = -1;
      const pickCard = (x: number, y: number) => {
        ndc.set(x * 2 - 1, -(y * 2 - 1));
        ray.setFromCamera(ndc, camera);
        const list = allShards.filter((s) => s.pivot.visible).map((s) => (s.fm.visible ? s.fm : s.bm));
        const hit = ray.intersectObjects(list, false)[0];
        return hit ? (meshCard.get(hit.object) ?? -1) : -1;
      };
      const onPinPointerLeave = () => {
        pointerIn = false;
        dirty = true;
      };
      const onCanvasClick = (e: MouseEvent) => {
        if (!step) return;
        const r = canvas.getBoundingClientRect();
        const hit = pickCard((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        tapCard = hit === tapCard ? -1 : hit;
        dirty = true;
      };
      pin.addEventListener("pointerleave", onPinPointerLeave);
      canvas.addEventListener("click", onCanvasClick);

      pin.addEventListener("pointermove", onPinPointerMove);
      canvas.addEventListener("pointerdown", onCanvasPointerDown);
      window.addEventListener("pointermove", onWinPointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      pin.addEventListener("keydown", onPinKeyDown);
      alignBtn.addEventListener("click", onAlignClick);

      function lineUp(fast: boolean) {
        if (mode === "locked" || tween) return;
        tween = { t0: performance.now(), dur: fast ? T(1 / 8) : T(3 / 8), th0: th, ph0: ph, ease: fast ? attack : weight };
        dirty = true;
      }
      function lock(now: number) {
        if (mode === "locked") return;
        mode = "locked";
        lockAt = now;
        tween = null;
        inkDone = false;
        th = thT = 0;
        ph = phT = 0;
        exp.dataset.locked = "";
        lockx.classList.remove("on");
        void lockx.offsetWidth;
        lockx.classList.add("on");
        live.textContent = "Aligned: Rajat.";
        thunk();
        dirty = true;
      }

      document.addEventListener("ui:tick", tick);
      document.addEventListener("ui:thunk", thunk);

      /* frame */
      const P = V(0, 0, 0);
      const dot = V(0, 0, 0);
      const sgn = (v: number) => (v < 0 ? "−" : "+") + Math.abs(v).toFixed(1).padStart(4, "0") + "°";
      const hint = () => {
        const h: string[] = [];
        if (Math.abs(th) > 1.5) h.push(input === "touch" ? (th > 0 ? "→" : "←") : th > 0 ? "←" : "→");
        if (Math.abs(ph) > 1.5 && input !== "touch") h.push(ph > 0 ? "↓" : "↑");
        return h.join(" ");
      };
      function scrollTarget() {
        const run = exp.offsetHeight - pin.offsetHeight;
        return run > 0 ? clamp((topH - exp.getBoundingClientRect().top) / run, 0, 1) : 0;
      }

      function update(now: number, dt: number) {
        const sT = scrollTarget();
        if (sT > 0.012 && mode !== "locked" && !tween) lineUp(true);
        // the hand-off from the static name starts once nothing covers it (after the loading sheet there is none)
        if (introAt === null && !root.hasAttribute("data-boot")) introAt = now;
        intro = introAt === null ? 1 : 1 - weight(seg(now - introAt, 150, 1150));
        if (intro > 0) dirty = true;

        // breathers: every 7.6 s the drift eases halfway toward the view for ~2 s (not into it: what lines up is
        // the visitor's to find), and the hero line changes as that pause begins, so the eye lands on the words
        let breath = 0;
        if (introAt !== null && step === 0 && leads.length && now - introAt > 1400) {
          const since = now - introAt - 1400;
          const u = (since % 7600) / 7600;
          breath = u > 0.62 && u < 0.92 ? Math.sin((Math.PI * (u - 0.62)) / 0.3) ** 2 : 0;
          const want = (Math.floor(since / 7600) + (u >= 0.62 ? 1 : 0)) % leads.length;
          if (want !== leadIdx) showLead(want);
          const inBreath = breath > 0.15;
          if (inBreath !== exp.hasAttribute("data-breath")) exp.toggleAttribute("data-breath", inBreath);
          if (breath > 0) dirty = true;
        }
        const s0 = sS;
        sS += (sT - sS) * (1 - Math.exp(-dt * 10));
        if (Math.abs(sT - sS) < 1e-4) sS = sT;
        if (sS !== s0) dirty = true;
        const st = sS < 0.04 ? 0 : sS < 0.3 ? 1 : sS < 0.58 ? 2 : 3;
        if (st !== step) {
          step = st;
          exp.dataset.step = String(st);
          if (st) tick();
        }

        if (tween) {
          const u = tween.ease(clamp((now - tween.t0) / tween.dur, 0, 1));
          th = thT = tween.th0 * (1 - u);
          ph = phT = tween.ph0 * (1 - u);
          dirty = true;
          if (u >= 1) lock(now);
        } else if (mode !== "locked") {
          if (input === "drift") {
            thT = driftTh(now) * (1 - intro) * (1 - 0.5 * breath);
            phT = driftPh(now) * (1 - intro) * (1 - 0.5 * breath);
          } else if (input === "mouse") {
            thT = clamp((px - 0.36) * 80, -55, 55);
            phT = clamp(-(py - 0.58) * 46, -30, 30);
          } else if (input === "touch") phT *= Math.exp(-dt * 6);
          const d = Math.hypot(thT, phT);
          const f = d < 10 ? 0.5 + 0.05 * d : 1;
          const k = 1 - Math.exp(-dt * 7);
          th += (thT * f - th) * k;
          ph += (phT * f - ph) * k;
          dirty = true;
          // not during the hand-off: the name starts aligned, and that isn't the visitor finding the view
          if (intro === 0 && input !== "drift" && Math.hypot(th, ph) < 1.6 && d * f < 2.4) lock(now);
        } else {
          const look = fine && moved && !step;
          const k = 1 - Math.exp(-dt * 9);
          const a = th;
          const b = ph;
          th += ((look ? (px - 0.5) * 10 : 0) - th) * k;
          ph += ((look ? -(py - 0.5) * 6 : 0) - ph) * k;
          if (Math.abs(th - a) + Math.abs(ph - b) > 1e-4) dirty = true;
        }
        if (lockAt !== null && !inkDone) {
          dirty = true;
          if (now - lockAt > 1000) inkDone = true;
        }
        const lookS = fine && moved && step > 0;
        const k2 = 1 - Math.exp(-dt * 6);
        const a2 = parT;
        const b2 = parP;
        parT += ((lookS ? (px - 0.5) * 6 : 0) - parT) * k2;
        parP += ((lookS ? -(py - 0.5) * 4 : 0) - parP) * k2;
        if (Math.abs(parT - a2) + Math.abs(parP - b2) > 1e-4) dirty = true;

        // the block under the pointer (or the tapped one), eased per block
        let target = -1;
        if (step > 0) {
          if (tapCard >= 0) target = tapCard;
          else if (fine && pointerIn && moved) target = pickCard(px, py);
        } else tapCard = -1;
        const kh = 1 - Math.exp(-dt * 12);
        cards.forEach((cd, ci) => {
          const want = ci === target ? 1 : 0;
          if (cd.hv === want) return;
          cd.hv += (want - cd.hv) * kh;
          if (Math.abs(cd.hv - want) < 1e-3) cd.hv = want;
          dirty = true;
        });
        pin.style.cursor = target >= 0 ? "pointer" : "";
        if (!dirty) return;
        let more = false; // something is still moving: render the next frame too

        const e1 = weight(seg(sS, 0.04, 0.26));
        const e2 = weight(seg(sS, 0.3, 0.46));
        const e3 = weight(seg(sS, 0.62, 0.86));
        let ct = th;
        let cp = ph;
        let cr = Dn;
        ([[24, -10, Dt * 1.04, e1], [0, 0, Dt, e2], [0, 0, Dt * 0.96, e3]] as [number, number, number, number][]).forEach(([t, p, r, e]) => {
          ct += (t - ct) * e;
          cp += (p - cp) * e;
          cr += (r - cr) * e;
        });
        ct += parT;
        cp += parP;
        const rt = (ct * Math.PI) / 180;
        const rp = (cp * Math.PI) / 180;
        camera.position.set(cr * Math.sin(rt) * Math.cos(rp), cr * Math.sin(rp), cr * Math.cos(rt) * Math.cos(rp));
        camera.lookAt(0, 0, 0);
        if (intro > 0 || camera.zoom !== 1) {
          camera.zoom = 1 + (introZoom - 1) * intro;
          if (intro > 0) camera.setViewOffset(W, H, 0, introDy * intro, W, H);
          else camera.clearViewOffset();
          camera.updateProjectionMatrix();
        }

        const goU = seg(sS, 0.03, 0.2);
        const fade = 1 - seg(sS, 0.13, 0.26);
        const sweep = 420 / Math.max(1, parts.length);
        parts.forEach((p, i) => {
          const lam = lockAt === null ? 0 : attack(clamp((now - lockAt - p.rank * sweep) / 250, 0, 1));
          const g = goU > 0 ? local(goU, p.rank, parts.length) : 0;
          const kL = p.k + (1 - p.k) * lam;
          const kX = 1 + (p.k - 1) * 1.9;
          const k = kL + (kX - kL) * g;
          const inked = Math.max(lam, intro) * (1 - g);
          P.set(p.c.x * k, p.c.y * k, Dn * (1 - k));
          if (!p.edge) dot.copy(P); // the orange square: the callout hangs from it
          if (!p.mesh) return;
          p.mesh.position.copy(P);
          p.mesh.quaternion.copy(QI);
          p.mesh.scale.setScalar(k);
          const mat = p.mesh.material as InstanceType<typeof THREE.MeshBasicMaterial>;
          mat.opacity = fade;
          p.mesh.visible = fade > 0.001;
          if (p.edge) {
            mat.color.lerpColors(BLUE, INK, inked);
            const eo = (cons ? 0.55 : 0.3 * (1 - inked)) * fade;
            (p.edge.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = eo;
            p.edge.visible = eo > 0; // a line at opacity 0 draws nothing: skip the draw (here and below)
          }
          projPos.set([P.x, P.y, P.z, p.c.x, p.c.y, 0], i * 6);
        });
        projGeo.attributes.position.needsUpdate = true;
        const po = (cons ? 0.5 : 0.18) * (1 - goU) * (1 - intro);
        (projectors.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = po;
        projectors.visible = po > 0;
        callout.position.copy(dot);
        const co = (1 - intro) * (1 - seg(sS, 0.01, 0.08));
        calloutEl.style.opacity = co.toFixed(3);
        calloutEl.style.visibility = co > 0.001 ? "visible" : "hidden";
        if (W < 640) {
          // no room beside the drifting dot on a phone: the note spans the screen under it (CSS), placed from the
          // dot's screen x this frame
          camera.updateMatrixWorld();
          calloutEl.style.setProperty("--sx", (((P.copy(dot).project(camera).x + 1) * W) / 2).toFixed(1) + "px");
        }

        const appear = seg(sS, 0.08, 0.26);
        const settle = seg(sS, 0.44, 0.58);
        const flipU = seg(sS, 0.6, 0.8);
        const n = allShards.length;
        allShards.forEach((s) => {
          // a hovered block gathers its own pieces (readable while the rest stay scattered) and lifts
          const hv = cards[s.ci].hv;
          const ls = Math.max(local(settle, s.rank, n), hv);
          const lf = local(flipU, s.rank, n);
          const k = s.k + (1 - s.k) * ls;
          const op = local(appear, s.rank, n);
          const turn = Math.PI * lf;
          s.pivot.position.lerpVectors(s.S, s.G, ls);
          s.pivot.position.z += 14 * hv;
          s.pivot.scale.setScalar(k);
          s.pivot.rotation.set(0, turn, 0);
          s.pivot.visible = op > 0.001;
          // only one face points at the camera; skip the draw the GPU would cull anyway
          const front = Math.sin(turn) * (camera.position.x - s.pivot.position.x) + Math.cos(turn) * (camera.position.z - s.pivot.position.z) > 0;
          s.fm.visible = front;
          s.bm.visible = !front;
          (s.fm.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = op;
          (s.bm.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = op;
          const edgeMat = s.edge.material as InstanceType<typeof THREE.LineBasicMaterial>;
          edgeMat.opacity = op * (cons ? 0.7 : 0.45 * (1 - ls)); // a gathered block is seamless; its corner marks say "this one"
          s.edge.visible = edgeMat.opacity > 0;
          edgeMat.color.lerpColors(BLUE, INK, seg(lf, 0.4, 0.6));
        });
        let steps = 2; // icon draw-on steps this frame
        cards.forEach((cd) => {
          const solved = local(flipU, cd.last, n) > 0.5;
          if (solved !== cd.solved) {
            cd.solved = solved;
            if (solved) tick();
          }
          // the icon draws on as the block appears, and the fix's icon as it flips (scrubbed with the scroll)
          const pairs: [Face, number][] = [
            [cd.frontFace, seg(local(appear, cd.last, n), 0.35, 1)],
            [cd.backFace, seg(local(flipU, cd.last, n), 0.55, 1)],
          ];
          for (const [f, p] of pairs)
            if (p !== f.p && (Math.abs(p - f.p) >= 0.04 || p === 0 || p === 1)) {
              if (steps-- > 0) drawOn(f, p);
              else more = true; // the rest wait a frame: each step re-mips a face texture
            }
          // hovered/tapped: corner marks and a peek at the other side of the block
          const hv = cd.hv;
          cd.marks.visible = hv > 0.001;
          if (cd.marks.visible) {
            cd.marks.position.set(cd.G.x, cd.G.y, 14 * hv);
            (cd.marks.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = 0.9 * hv;
          }
          const pt = cd.solved ? `was · ${cd.problem}` : `→ ${cd.fix}`;
          if (pt !== cd.peekText) {
            cd.peekText = pt;
            cd.peekEl.textContent = pt;
          }
          cd.peek.position.set(cd.G.x + (cd.G.x > 1 ? TWd / 2 : -TWd / 2), cd.G.y - THd / 2 - 8, 14 * hv);
          cd.peekEl.style.opacity = hv.toFixed(3);
          cd.peekEl.style.visibility = hv > 0.001 ? "visible" : "hidden";
        });
        const ctr = cards.map((cd) => cd.shards.reduce((v, s) => v.add(s.pivot.position), V(0, 0, 0)).multiplyScalar(1 / cd.shards.length));
        PAIRS.forEach(([a, b], j) => {
          const pa = ctr[a];
          const pb = ctr[b];
          linkPos.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], j * 6);
        });
        linkGeo.attributes.position.needsUpdate = true;
        links.computeLineDistances();
        const lo = (cons ? 0.8 : 0.5) * seg(sS, 0.34, 0.46) * (1 - seg(sS, 0.64, 0.76));
        (links.material as InstanceType<typeof THREE.LineDashedMaterial>).opacity = lo;
        links.visible = lo > 0;
        if (lo > 0) {
          // once the parts are linked, the dashes flow along the links: the parts are talking
          const ld = linkGeo.getAttribute("lineDistance");
          const arr = ld.array as Float32Array;
          for (let j = 0; j < arr.length; j++) arr[j] -= (now % 1e6) * 0.012;
          ld.needsUpdate = true;
          more = true;
        }
        const fo = seg(sS, 0.76, 0.88);
        (frame.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = fo;
        frame.visible = fo > 0;
        sysEl.style.opacity = fo.toFixed(3);

        let r1 = "";
        let r2 = "";
        let bar = 0;
        if (!step) {
          const d = Math.hypot(th, ph);
          r1 = "Turn " + sgn(th) + " · Tilt " + sgn(ph);
          if (mode === "locked") {
            r2 = "Aligned · 0.0°";
            bar = 1;
          } else {
            r2 = "Off " + d.toFixed(1) + "°" + (input !== "drift" && now - playAt > 7000 ? " · try " + hint() : "");
            bar = clamp(1 - d / 40, 0, 1);
          }
        } else if (step === 1) {
          r1 = "Step 01 of 03";
          r2 = "Parts 6 · connected 0";
          bar = 1 / 3;
        } else if (step === 2) {
          r1 = "Step 02 of 03";
          r2 = "Parts 6 · links 6";
          bar = 2 / 3;
        } else {
          r1 = "Step 03 of 03";
          r2 = "One system · parts 6";
          bar = 1;
        }
        if (step && target >= 0) r2 = `Part 0${target + 1} · ${cards[target].solved ? cards[target].fix : cards[target].problem}`;
        const key = r1 + "|" + r2 + "|" + bar.toFixed(3);
        if (key !== hudKey) {
          hudKey = key;
          hudRow1.textContent = r1;
          hudRow2.textContent = r2;
          hudBar.style.width = (bar * 100).toFixed(1) + "%";
        }

        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        dirty = more;
      }

      let last = performance.now();
      let raf = 0;
      function frameLoop() {
        if (disposed) return;
        raf = requestAnimationFrame(frameLoop);
        const now = performance.now();
        const dt = clamp((now - last) / 1000, 0.001, 0.05);
        last = now;
        if (visible) update(now, dt);
      }
      const io = new IntersectionObserver((es) => {
        visible = es[es.length - 1].isIntersecting;
        dirty = true;
      });
      io.observe(exp);
      const mo = new MutationObserver(() => {
        cons = document.documentElement.dataset.construction === "on";
        dirty = true;
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-construction"] });
      let rz = 0;
      const onResize = () => {
        clearTimeout(rz);
        rz = window.setTimeout(layout, 120);
      };
      window.addEventListener("resize", onResize);

      buildName();
      // Compile every program off the main thread (parallel shader compile) while the static name is still up,
      // then upload the card faces, so neither the hand-off nor the first scroll into the story stalls on them.
      // Everything is still visible here, so compileAsync covers every material.
      // capped: a context lost mid-compile never reports ready, and the teardown below only exists once boot returns
      await Promise.race([renderer.compileAsync(scene, camera), new Promise((r) => setTimeout(r, 3000))]);
      faceTex.forEach((t) => renderer.initTexture(t));

      // a keyboard stop only while there is something to turn: page.tsx renders the still box without one
      const PIN_ATTRS: [string, string][] = [
        ["tabindex", "0"],
        ["role", "group"],
        ["aria-roledescription", "interactive drawing"],
        ["aria-label", "Rajat, cut into pieces at different depths. Use the arrow keys to turn the view until the pieces line up, or press Enter to line them up."],
      ];
      const cleanup = () => {
        PIN_ATTRS.forEach(([k]) => pin.removeAttribute(k));
        cancelAnimationFrame(raf);
        clearTimeout(rz);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onWinPointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
        pin.removeEventListener("pointermove", onPinPointerMove);
        pin.removeEventListener("keydown", onPinKeyDown);
        canvas.removeEventListener("pointerdown", onCanvasPointerDown);
        canvas.removeEventListener("click", onCanvasClick);
        pin.removeEventListener("pointerleave", onPinPointerLeave);
        alignBtn.removeEventListener("click", onAlignClick);
        document.removeEventListener("ui:tick", tick);
        document.removeEventListener("ui:thunk", thunk);
        io.disconnect();
        mo.disconnect();
        labelRenderer.domElement.remove();
        renderer.dispose();
        renderer.forceContextLoss(); // browsers cap live WebGL contexts; free this one on navigation
        canvas.remove();
      };
      // unmounted while it compiled (or React's dev double mount): the page belongs to whichever stage is mounted now
      if (disposed) return cleanup;

      exp.classList.add("gl-ready");
      PIN_ATTRS.forEach(([k, v]) => pin.setAttribute(k, v));
      // The stage is up, so the loading sheet lifts (a first visit's a beat later; that visit is then remembered).
      // A #fragment asked for was pushed down by the stage's scroll runway just now, so go back to it.
      clearTimeout(cap);
      const lift = () => {
        unboot();
        if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
      };
      // Under the loading sheet the static name was never seen, so there is nothing to hand off from: the first frame
      // already has the pieces scattered on their drift (not easing out of the lined-up pose as the sheet lifts), and
      // what they spell stays for the visitor to line up.
      if (root.hasAttribute("data-boot")) {
        const t = performance.now();
        introAt = t - 2000;
        th = thT = driftTh(t);
        ph = phT = driftPh(t);
      }
      if (root.dataset.boot === "splash") {
        // a first visit holds the sheet a beat (from its first paint), so it reads as a splash rather than a flash
        const shown = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
        setTimeout(
          () => {
            try {
              localStorage.setItem("seen", "1");
            } catch {
              // storage blocked: the next visit is a first visit again
            }
            lift();
          },
          Math.max(0, shown + 1200 - performance.now())
        );
      } else lift();
      alignBtn.hidden = false;
      hud.hidden = false;
      // "Move across the pieces to find the view" (CSS picks the fine/coarse line and hides it once aligned)
      const hintEl = exp.querySelector<HTMLElement>(".hook-copy .hint");
      if (hintEl) hintEl.hidden = false;
      if (leads.length) showLead(0);
      layout();
      raf = requestAnimationFrame(frameLoop);
      return cleanup;
    }

    // At hydration, not on `load`: the server-rendered name is already painted (it is the LCP), and waiting for
    // every font and image kept the hero static for a visible beat on a cold load.
    start();

    return () => {
      disposed = true;
      clearTimeout(cap);
      unboot();
      teardown?.();
    };
  }, [problems, leads]);

  return null;
}
