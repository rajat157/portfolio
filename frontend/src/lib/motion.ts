// Reduced motion, with the visitor's own choice on top of the system's: when the OS asks for reduced motion
// the header shows a Motion toggle, and turning it on sets <html data-motion="on"> (kept in localStorage and
// re-applied before paint by the layout's boot script), which every motion check here and in globals.css honours.

export const MOTION_KEY = "motion";

export function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches &&
    document.documentElement.dataset.motion !== "on"
  );
}
