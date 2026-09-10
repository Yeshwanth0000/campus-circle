"use client";

import { requestSearchOpen } from "@/lib/overlayBus";

// Mobile-only counterpart to the search pill the palette renders on
// desktop — same overlay, just triggered from the header's icon cluster
// so the phone header stays a single row.
export default function SearchIconButton() {
  return (
    <button
      type="button"
      onClick={requestSearchOpen}
      aria-label="Search listings"
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 sm:hidden"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m21 21-4.3-4.3" />
      </svg>
    </button>
  );
}
