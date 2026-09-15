"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";

interface GalleryVideoProps {
  src: string;
  label: string;
}

export function GalleryVideo({ src, label }: GalleryVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const autoPausing = useRef(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (isInView) {
      if (!userPaused.current) {
        video.play().catch(() => {});
      }
    } else if (!video.paused) {
      autoPausing.current = true;
      video.pause();
    }
  }, [isInView]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      controls
      preload="metadata"
      aria-label={label}
      className="absolute inset-0 h-full w-full object-cover"
      onPause={() => {
        if (autoPausing.current) {
          autoPausing.current = false;
        } else {
          userPaused.current = true;
        }
      }}
      onPlay={() => {
        userPaused.current = false;
      }}
    />
  );
}
