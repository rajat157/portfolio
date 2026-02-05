import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/custom.css";
import { Providers } from "@/providers";
import { Header, Footer, ScrollToTop } from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Rajat Kumar R | Software Architect & Developer",
    template: "%s | Rajat Kumar R",
  },
  description: "Portfolio of Rajat Kumar R - Software Architect & Developer specializing in Python, Django, FastAPI, Next.js, and cloud technologies.",
  keywords: ["software architect", "developer", "Python", "Django", "FastAPI", "Next.js", "React", "portfolio", "blog"],
  authors: [{ name: "Rajat Kumar R" }],
  creator: "Rajat Kumar R",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rajat Kumar R",
    title: "Rajat Kumar R | Software Architect & Developer",
    description: "Portfolio of Rajat Kumar R - Software Architect & Developer specializing in Python, Django, FastAPI, Next.js, and cloud technologies.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@rajatkumarr",
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
      name: "Rajat Kumar R",
      description: "Portfolio of Rajat Kumar R - Software Architect & Developer",
      publisher: {
        "@id": `${siteUrl}/#person`,
      },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Rajat Kumar R",
      jobTitle: "Software Architect & Developer",
      url: siteUrl,
      sameAs: [
        "https://github.com/rajatkumarr",
        "https://linkedin.com/in/rajatkumarr",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <ScrollToTop />
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
