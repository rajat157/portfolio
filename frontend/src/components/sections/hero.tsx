"use client";

import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";

export function Hero() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center relative px-4">
      <div className="container mx-auto text-center">
        <Reveal delay={0.1}>
          <p className="text-muted-foreground text-lg md:text-xl mb-4">
            Hello, I&apos;m
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <h1 className="text-hero font-bold tracking-tight mb-6">
            Rajat Kumar R
          </h1>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="text-display text-muted-foreground mb-8">
            Software Architect & Developer
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Building scalable systems, from supercomputers to trading platforms.
            8+ years of experience in high-performance systems, cloud infrastructure, and modern web technologies.
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/projects"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
            >
              View Projects
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </Reveal>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="h-6 w-6" />
        <span className="sr-only">Scroll down</span>
      </motion.button>
    </section>
  );
}
