"use client";

import { useRef, useState, useTransition } from "react";
import { toggleSaved } from "@/app/actions/saved";

export default function SaveButton({
  listingId,
  initialSaved,
  variant = "icon",
}: {
  listingId: string;
  initialSaved: boolean;
  variant?: "icon" | "full";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [justSaved, setJustSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    if (next) {
      setJustSaved(true);
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
      burstTimeoutRef.current = setTimeout(() => setJustSaved(false), 450);
    }
    startTransition(async () => {
      await toggleSaved(listingId, saved);
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition ${
          saved
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70"
            : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        <HeartIcon filled={saved} justSaved={justSaved} />
        {saved ? "Saved" : "Save for later"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:scale-110 hover:text-rose-500 dark:bg-slate-900/80 dark:text-slate-400"
    >
      <HeartIcon filled={saved} justSaved={justSaved} />
    </button>
  );
}

function HeartIcon({ filled, justSaved = false }: { filled: boolean; justSaved?: boolean }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      {justSaved && (
        <span className="absolute inset-0 -m-1 rounded-full bg-rose-400 animate-heart-burst" />
      )}
      <svg
        viewBox="0 0 24 24"
        className={`relative h-4 w-4 ${justSaved ? "animate-heart-pop" : ""} ${filled ? "fill-rose-500 text-rose-500" : "fill-none text-current"}`}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.716-4.35-9.428-8.06C.66 10.42 1.1 6.9 3.9 5.28c2.35-1.36 5.02-.6 6.6 1.32.5.6.9 1.2 1.5 1.2s1-.6 1.5-1.2c1.58-1.92 4.25-2.68 6.6-1.32 2.8 1.62 3.24 5.14 1.33 7.66C18.716 16.65 12 21 12 21z"
        />
      </svg>
    </span>
  );
}
