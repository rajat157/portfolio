import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/site-chrome";
import { Guides, CursorReadout } from "@/components/construction";
import { fontVariables } from "@/lib/fonts";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Pre-paint state, before React hydrates (D13): the root layout never
// re-renders, so this is the only place `html.js` is ever set.
// adds .js, re-applies the visitor's Motion choice (lib/motion.ts) before paint, and on the home, when its stage
// will run (motion on, no #fragment asked for), covers the page with the loading sheet until the stage takes over
// (html[data-boot]: globals.css, components/home/splash.tsx); "splash" marks a first visit ("seen" unset, so again
// after site data is cleared), which holds it a beat longer. The stage clears it; this after 8 s regardless.
const BOOT =
  "(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('motion')==='on')d.dataset.motion='on'}catch(e){}" +
  "if(location.pathname==='/'&&!location.hash&&(d.dataset.motion==='on'||!matchMedia('(prefers-reduced-motion: reduce)').matches)){" +
  "var s='splash';try{if(localStorage.getItem('seen'))s=''}catch(e){}d.dataset.boot=s;setTimeout(function(){delete d.dataset.boot},8000)}})()";

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
  // each page's own URL on the site host; "./" resolves against the route
  alternates: { canonical: "./" },
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
      className={fontVariables}
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
