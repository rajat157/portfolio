#!/usr/bin/env python
"""font-metrics.py -- generates src/lib/font-metrics.ts and src/lib/name-outline.ts.

The server-side drawing layout (src/lib/drawing.ts, BUILD-PLAN.md §3.2) needs to
measure Instrument Sans / Martian Mono text widths without a browser canvas and
without depending on next/font having loaded. This script downloads the exact
Google Fonts woff2 files next/font bundles, instances them with fontTools, and
writes their per-glyph advances (hmtx) as a plain TS data file.

It also emits name-outline.ts (D21, BUILD-PLAN.md §0 item 1): the "Rajat" outline
at Instrument Sans wdth 75 / wght 650, kerned, as one combined y-down SVG path --
the home NameMark's SSR/no-JS/LCP mark and the three.js stage's shard texture.

Run with the interpreter that has fontTools + brotli (not the `python` on PATH,
which may be the WindowsApps stub):
  C:\\Users\\rajat\\miniconda3\\python.exe scripts/font-metrics.py

Deterministic: re-running leaves `git diff --exit-code src/lib/font-metrics.ts
src/lib/name-outline.ts` = 0.
"""
import io
import json
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

OUT_PATH = "src/lib/font-metrics.ts"
NAME_OUT_PATH = "src/lib/name-outline.ts"
NAME_TEXT = "Rajat"  # the full stop is drawn as the orange square, not a glyph

# The label table: printable ASCII plus the punctuation the drawing layout
# prints in node/edge/dimension labels (em dash, en dash, curly quotes,
# interpunct, multiplication sign, e-acute).
LABEL_CHARS = [chr(c) for c in range(0x20, 0x7F)] + list("\u2014\u2013\u2018\u2019\u00b7\u00d7\u00e9")


def fetch_latin_woff2(css2_url: str) -> bytes:
    """GETs a Google Fonts css2 stylesheet with a Chrome UA (Google serves
    woff2 only to browser UAs) and downloads the `/* latin */` block's file --
    the same file next/font would download for this family/axis request."""
    req = urllib.request.Request(css2_url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        css = r.read().decode("utf-8")
    blocks = css.split("/* ")
    latin = next(b for b in blocks if b.startswith("latin */"))
    url = latin.split("url(", 1)[1].split(")", 1)[0]
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read()


def central_of(font: TTFont) -> float:
    """(hhea ascender + descender) / 2 / upm -- the dominant-baseline:central
    fraction the SSR drawing layout needs (replaces the DOM's own computation)."""
    hhea = font["hhea"]
    upm = font["head"].unitsPerEm
    return (hhea.ascent + hhea.descent) / 2 / upm


def kern_lookups(font: TTFont) -> list:
    """Every GPOS lookup referenced by the `kern` feature, across all scripts."""
    gpos = font["GPOS"].table
    idxs: set = set()
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == "kern":
            idxs.update(fr.Feature.LookupListIndex)
    return [gpos.LookupList.Lookup[i] for i in sorted(idxs)]


def pair_adjust(subtable, g1: str, g2: str):
    """The X-advance adjustment of `g1` for a PairPos subtable (Format 1 or 2),
    or None if the subtable has no rule for this pair."""
    if subtable.Format == 1:
        cov = subtable.Coverage.glyphs
        if g1 not in cov:
            return None
        for pvr in subtable.PairSet[cov.index(g1)].PairValueRecord:
            if pvr.SecondGlyph == g2:
                return getattr(pvr.Value1, "XAdvance", 0) if pvr.Value1 is not None else 0
        return None
    if subtable.Format == 2:
        cov = subtable.Coverage.glyphs
        if g1 not in cov:
            return None
        c1 = subtable.ClassDef1.classDefs.get(g1, 0)
        c2 = subtable.ClassDef2.classDefs.get(g2, 0)
        recs = subtable.Class1Record
        if c1 >= len(recs):
            return None
        rec2 = recs[c1].Class2Record
        if c2 >= len(rec2):
            return None
        v = rec2[c2].Value1
        return getattr(v, "XAdvance", 0) if v is not None else 0
    return None


def kern_value(font: TTFont, lookups: list, g1: str, g2: str) -> int:
    """GPOS pair kerning for (g1, g2): per lookup the first matching subtable
    (unwrapping Extension LookupType 9) wins, summed across lookups -- as
    HarfBuzz does."""
    total = 0
    for lookup in lookups:
        for st in lookup.SubTable:
            real = getattr(st, "ExtSubTable", st)
            if getattr(real, "LookupType", 2) != 2:
                continue
            v = pair_adjust(real, g1, g2)
            if v is not None:
                total += v
                break
    return total


def name_outline(sans_bytes: bytes) -> dict:
    """"Rajat" outline, Instrument Sans wdth 75 / wght 650 (D21): per-glyph
    outlines positioned by advance + GPOS kerning, combined into one y-down SVG
    path (origin at the top-left of the cap line). The orange full-stop square
    follows after a gap; both square and gap scale from unitsPerEm at the
    stage's canvas-texture ratios (0.13 em / 0.05 em, home-prototype.html's
    buildName() DOT/GAPD for the 'grid' cut)."""
    font = TTFont(io.BytesIO(sans_bytes))
    font = instancer.instantiateVariableFont(font, {"wdth": 75, "wght": 650})
    upm = font["head"].unitsPerEm
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    lookups = kern_lookups(font)

    names = [cmap[ord(c)] for c in NAME_TEXT]
    advances = [hmtx[n][0] for n in names]
    kerns = [kern_value(font, lookups, names[i], names[i + 1]) for i in range(len(names) - 1)]

    xs = [0]
    for i in range(len(names) - 1):
        xs.append(xs[-1] + advances[i] + kerns[i])
    run = xs[-1] + advances[-1]

    bp = BoundsPen(glyph_set)
    glyph_set[names[0]].draw(bp)  # "R": a flat-topped capital -> its own yMax is the cap height
    cap = bp.bounds[3]
    bp = BoundsPen(glyph_set)
    glyph_set[names[2]].draw(bp)  # "j": the name's only descender
    desc = -bp.bounds[1]

    ntos = lambda v: str(round(v))  # noqa: E731 -- integer coords keep the path short and exactly reproducible
    parts = []
    for name, x in zip(names, xs):
        pen = SVGPathPen(glyph_set, ntos=ntos)
        tpen = TransformPen(pen, (1, 0, 0, -1, x, cap))  # y negated, then shifted so the cap line is y=0
        glyph_set[name].draw(tpen)
        cmds = pen.getCommands()
        if cmds:
            parts.append(cmds)

    dot = round(upm * 0.13)
    gap = round(upm * 0.05)
    return {
        "upm": upm,
        "path": " ".join(parts),
        "run": round(run),
        "cap": round(cap),
        "desc": round(desc),
        "dot": dot,
        "gap": gap,
    }


def label_table(sans_bytes: bytes) -> dict:
    """Instrument Sans, instanced at wdth 100 / wght 500 (src/lib/drawing.ts'
    `.d-label` weight): per-char advances for LABEL_CHARS, plus central."""
    font = TTFont(io.BytesIO(sans_bytes))
    font = instancer.instantiateVariableFont(font, {"wdth": 100, "wght": 500})
    hmtx = font["hmtx"]
    cmap = font.getBestCmap()
    advances = {}
    for ch in LABEL_CHARS:
        glyph = cmap.get(ord(ch))
        if glyph is None:
            continue
        advances[ch] = hmtx[glyph][0]
    return {"advances": advances, "central": central_of(font)}


def mono_metrics(mono_bytes: bytes) -> dict:
    """Martian Mono, wght 400 (served already static -- D12 drops the wdth
    axis, it is only ever used at wdth 100): the advance of every ASCII glyph,
    asserted uniform (it is a monospace face), plus central."""
    font = TTFont(io.BytesIO(mono_bytes))
    hmtx = font["hmtx"]
    cmap = font.getBestCmap()
    advances = set()
    zero_advance = None
    for c in range(0x21, 0x7F):
        glyph = cmap.get(c)
        if glyph is None:
            continue
        w = hmtx[glyph][0]
        advances.add(w)
        if c == ord("0"):
            zero_advance = w
    assert len(advances) == 1, f"Martian Mono ASCII advances are not uniform: {sorted(advances)}"
    assert zero_advance is not None, "Martian Mono has no '0' glyph"
    return {"advance": zero_advance, "central": central_of(font)}


def write_ts(label: dict, mono: dict, path: str) -> None:
    lines = [
        "// Generated by scripts/font-metrics.py -- do not edit by hand.",
        "// Re-run: C:\\Users\\rajat\\miniconda3\\python.exe scripts/font-metrics.py",
        "",
        "// Instrument Sans, wdth 100 / wght 500 (src/lib/drawing.ts' label weight).",
        f"export const LABEL_CENTRAL = {round(label['central'], 6)!r};",
        "",
        "export const LABEL_ADVANCES: Record<string, number> = {",
    ]
    for ch in sorted(label["advances"]):
        lines.append(f"  {json.dumps(ch)}: {label['advances'][ch]},")
    lines += [
        "};",
        "",
        "// Martian Mono, wght 400 (monospace: every ASCII glyph shares this advance).",
        f"export const MONO_ADVANCE = {mono['advance']};",
        f"export const MONO_CENTRAL = {round(mono['central'], 6)!r};",
        "",
    ]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))


def write_name_outline_ts(name: dict, path: str) -> None:
    view_w = name["run"] + name["gap"] + name["dot"]
    view_h = name["cap"] + name["desc"]
    lines = [
        "// Generated by scripts/font-metrics.py -- do not edit by hand.",
        "// Re-run: C:\\Users\\rajat\\miniconda3\\python.exe scripts/font-metrics.py",
        "",
        "// \"Rajat\" outline, Instrument Sans wdth 75 / wght 650, kerned (R.a, a.j, j.a, a.t).",
        "// NAME_PATH is combined, y-down, origin at the top-left of the cap line; viewBox",
        "// \"0 0 NAME_VIEW_W NAME_VIEW_H\". The orange full-stop square follows at",
        "// x=[NAME_RUN+NAME_GAP, +NAME_DOT], y=[NAME_CAP-NAME_DOT, NAME_CAP] (baseline-flush).",
        f"export const NAME_UNITS_PER_EM = {name['upm']};",
        f"export const NAME_PATH = {json.dumps(name['path'])};",
        f"export const NAME_RUN = {name['run']};",
        f"export const NAME_CAP = {name['cap']};",
        f"export const NAME_DESC = {name['desc']};",
        f"export const NAME_DOT = {name['dot']};",
        f"export const NAME_GAP = {name['gap']};",
        f"export const NAME_VIEW_W = {view_w};",
        f"export const NAME_VIEW_H = {view_h};",
        "",
    ]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))


def main() -> None:
    sans_bytes = fetch_latin_woff2(
        "https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&display=swap"
    )
    label = label_table(sans_bytes)
    name = name_outline(sans_bytes)

    mono_bytes = fetch_latin_woff2("https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400&display=swap")
    mono = mono_metrics(mono_bytes)

    write_ts(label, mono, OUT_PATH)
    write_name_outline_ts(name, NAME_OUT_PATH)

    print(f"label chars: {len(label['advances'])}")
    print(f"mono advance (0): {mono['advance']}")
    print(f"label central: {label['central']:.6f}")
    print(f"mono central: {mono['central']:.6f}")
    print(f"name run: {name['run']} cap: {name['cap']} desc: {name['desc']} dot: {name['dot']} gap: {name['gap']}")


if __name__ == "__main__":
    main()
