// The site's four families (D26), self-hosted: next/font/google fetched them at build time, and a failed fetch
// failed a production build. src/fonts holds exactly the "latin" files it served and preloaded (OFL, see OFL.txt).
// The @font-face rules match what it generated: the same family names and unicode-range, and the same
// "<family> Fallback" faces (globals.css), so pages render exactly as before.
import localFont from "next/font/local";

const latin = {
  prop: "unicode-range",
  value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
};

const sans = localFont({
  src: "../fonts/instrument-sans-latin.woff2",
  weight: "400 700",
  style: "normal",
  declarations: [{ prop: "font-family", value: "Instrument Sans" }, { prop: "font-stretch", value: "75% 100%" }, latin],
  adjustFontFallback: false,
  fallback: ["'Instrument Sans Fallback'"],
  variable: "--font-sans",
  display: "swap",
});

const mono = localFont({
  src: "../fonts/martian-mono-latin.woff2",
  weight: "100 800",
  style: "normal",
  declarations: [{ prop: "font-family", value: "Martian Mono" }, { prop: "font-stretch", value: "100%" }, latin],
  adjustFontFallback: false,
  fallback: ["'Martian Mono Fallback'"],
  variable: "--font-mono",
  display: "swap",
});

const hand = localFont({
  src: "../fonts/caveat-latin.woff2",
  weight: "500 700",
  style: "normal",
  declarations: [{ prop: "font-family", value: "Caveat" }, latin],
  adjustFontFallback: false,
  fallback: ["'Caveat Fallback'"],
  variable: "--font-hand",
  display: "swap",
});

const count = localFont({
  src: "../fonts/doto-latin.woff2",
  weight: "700 900",
  style: "normal",
  declarations: [{ prop: "font-family", value: "Doto" }, latin],
  adjustFontFallback: false,
  fallback: ["'Doto Fallback'"],
  variable: "--font-count",
  display: "swap",
});

// the four CSS variables, for <html className>
export const fontVariables = [sans, mono, hand, count].map((f) => f.variable).join(" ");
