"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [value, setValue] = useState(queryParam);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(queryParam);
  }, [queryParam]);

  function navigate(next: string) {
    const params = new URLSearchParams();
    if (next.trim()) params.set("q", next.trim());
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(value);
  }

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
    if (queryParam) navigate("");
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            handleClear();
          }
        }}
        placeholder="Search for textbooks, gadgets, cycles…"
        className={`w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 text-sm text-slate-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900 ${
          value ? "pr-9" : "pr-4"
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      )}
    </form>
  );
}
