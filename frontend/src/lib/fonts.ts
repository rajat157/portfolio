// The site's four families (D26), self-hosted: next/font/google fetched them at build time, and a failed fetch
// failed a production build. src/fonts holds exactly the "latin" files it served and preloaded (OFL, see OFL.txt).
// The @font-face rules match what it generated: the same unicode-range (next/font takes only literals, hence the
// repeats) and the same "<family> Fallback" faces (globals.css), so pages render as before. Each face is named after
// its const: Turbopack ignores a font-family given in `declarations` for the CSS variable.
import localFont from "next/font/local";

const instrumentSans = localFont({
  src: "../fonts/instrument-sans-latin.woff2",
  weight: "400 700",
  style: "normal",
  declarations: [
    { prop: "font-stretch", value: "75% 100%" },
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
  adjustFontFallback: false,
  fallback: ["'Instrument Sans Fallback'"],
  variable: "--font-sans",
  display: "swap",
});

const martianMono = localFont({
  src: "../fonts/martian-mono-latin.woff2",
  weight: "100 800",
  style: "normal",
  declarations: [
    { prop: "font-stretch", value: "100%" },
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
  adjustFontFallback: false,
  fallback: ["'Martian Mono Fallback'"],
  variable: "--font-mono",
  display: "swap",
});

const caveat = localFont({
  src: "../fonts/caveat-latin.woff2",
  weight: "500 700",
  style: "normal",
  declarations: [
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
  adjustFontFallback: false,
  fallback: ["'Caveat Fallback'"],
  variable: "--font-hand",
  display: "swap",
});

const doto = localFont({
  src: "../fonts/doto-latin.woff2",
  weight: "700 900",
  style: "normal",
  declarations: [
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
  adjustFontFallback: false,
  fallback: ["'Doto Fallback'"],
  variable: "--font-count",
  display: "swap",
});

// the four CSS variables, for <html className>
export const fontVariables = [instrumentSans, martianMono, caveat, doto].map((f) => f.variable).join(" ");
