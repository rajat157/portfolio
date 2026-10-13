import type { Metadata } from "next";
import { Instrument_Sans, Martian_Mono, Caveat, Doto } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/site-chrome";
import { Guides, CursorReadout } from "@/components/construction";

const sans = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const hand = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-hand",
  display: "swap",
});

const count = Doto({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-count",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Pre-paint state, before React hydrates (D13): the root layout never
// re-renders, so this is the only place `html.js` is ever set.
const BOOT = "(function(){document.documentElement.classList.add('js')})()";

export const metadata: Metadata = {
  title: {
    default: "Rajat | Software Architect & Developer",
    template: "%s | Rajat",
  },
  description: "Portfolio of Rajat - Software Architect & Developer specializing in Python, Django, FastAPI, Next.js, and cloud technologies.",
  keywords: ["software architect", "developer", "Python", "Django", "FastAPI", "Next.js", "React", "portfolio", "blog"],
  authors: [{ name: "Rajat" }],
  creator: "Rajat",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rajat",
    title: "Rajat | Software Architect & Developer",
    description: "Portfolio of Rajat - Software Architect & Developer specializing in Python, Django, FastAPI, Next.js, and cloud technologies.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rajat | Software Architect & Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Rajat",
      description: "Portfolio of Rajat - Software Architect & Developer",
      publisher: {
        "@id": `${siteUrl}/#person`,
      },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Rajat",
      jobTitle: "Software Architect & Developer",
      url: siteUrl,
      sameAs: [
        "https://github.com/rajat157",
        "https://www.linkedin.com/in/rajat-kumar-r",
      ],
      knowsAbout: [
        "Python",
        "Django",
        "Flask",
        "FastAPI",
        "Next.js",
        "React",
        "TypeScript",
        "PostgreSQL",
        "Docker",
        "Kubernetes",
        "AWS",
        "GCP",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${hand.variable} ${count.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <div className="kit-grain" aria-hidden="true" />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Guides />
        <CursorReadout />
      </body>
    </html>
  );
}
