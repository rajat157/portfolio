"use client";

import { ThemeProvider } from "./theme-provider";
import { LenisProvider } from "./lenis-provider";
import { Toaster } from "@/components/ui/sonner";
import { type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <LenisProvider>
        {children}
        <Toaster position="bottom-right" />
      </LenisProvider>
    </ThemeProvider>
  );
}
