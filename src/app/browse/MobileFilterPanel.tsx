"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function MobileFilterPanel({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // The sheet scrolls its own body — letting the page behind it scroll
    // too makes the content jump around underneath while dragging.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
          activeCount > 0
            ? "border-brand/40 bg-brand-light text-brand-dark dark:border-brand/40 dark:bg-brand/15 dark:text-brand"
            : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="sm:hidden">
            <div
              className="animate-sheet-backdrop-in fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="animate-sheet-panel-in fixed inset-x-0 bottom-0 z-[100] flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl shadow-slate-900/25 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="shrink-0 px-5 pb-2 pt-3">
                <div className="mx-auto h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="mt-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close filters"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* submit bubbles up from the form this wraps: blanking out
                  the empty fields first keeps them out of the query string,
                  so a shared /browse link reads ?condition=new rather than
                  ?price_max=&category=&condition=new. */}
              <div
                onSubmit={(e) => {
                  const form = e.target as HTMLFormElement;
                  form
                    .querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")
                    .forEach((field) => {
                      if (!field.value) field.disabled = true;
                    });
                }}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5"
              >
                {children}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
