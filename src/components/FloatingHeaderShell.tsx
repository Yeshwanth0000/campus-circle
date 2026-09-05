"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function FloatingHeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-30 transition-[padding] duration-300 ease-out ${
        scrolled ? "px-3 pt-3 sm:px-6" : "px-0 pt-0"
      }`}
    >
      <header
        className={`mx-auto max-w-6xl transition-all duration-300 ease-out ${
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
