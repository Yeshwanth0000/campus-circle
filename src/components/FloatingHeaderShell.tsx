"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Below this scroll distance the header always stays put — it only starts
// hiding once you've scrolled past the top area (roughly where the category
// strip / page content begins), so it doesn't flicker on tiny scroll bounces.
const REVEAL_ZONE_PX = 80;
const SCROLL_DELTA_THRESHOLD_PX = 8;

export default function FloatingHeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 16);

      const delta = y - lastY.current;
      if (y < REVEAL_ZONE_PX) {
        setHidden(false);
      } else if (delta > SCROLL_DELTA_THRESHOLD_PX) {
        setHidden(true);
      } else if (delta < -SCROLL_DELTA_THRESHOLD_PX) {
        setHidden(false);
      }
      lastY.current = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-30 transition-all duration-300 ease-out ${
        scrolled ? "px-3 pt-3 sm:px-6" : "px-0 pt-0"
      } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <header
        className={`mx-auto w-full max-w-none transition-all duration-300 ease-out sm:max-w-[min(94vw,96rem)] ${
          scrolled
            ? "rounded-2xl border border-slate-200/70 bg-white/75 shadow-lg shadow-slate-900/10 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60 dark:shadow-black/30"
            : "rounded-none border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        }`}
      >
        {children}
      </header>
    </div>
  );
}
