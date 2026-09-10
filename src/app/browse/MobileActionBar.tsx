"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

type Panel = "sort" | "category" | "filters" | null;

export default function MobileActionBar({
  currentSort,
  activeFilterCount,
  activeCategoryName,
  categoryContent,
  filtersContent,
}: {
  currentSort: string;
  activeFilterCount: number;
  activeCategoryName?: string;
  categoryContent: ReactNode;
  filtersContent: ReactNode;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? SORT_OPTIONS[0].label;

  function selectSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    // Re-sorting from page 3 of the old order lands on an arbitrary slice
    // of the new one — start over at the top instead.
    params.delete("page");
    setPanel(null);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <>
      {/* Hidden from sm up, which is exactly where the desktop filter
          sidebar takes over — no point showing both. */}
      <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900 text-white shadow-sm sm:hidden">
        <button
          type="button"
          onClick={() => setPanel("sort")}
          className="flex items-center justify-center gap-2 border-r border-white/10 px-2 py-2.5 transition-colors active:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3" />
          </svg>
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sort by</span>
            <span className="w-full truncate text-[10px] text-white/60">{currentSortLabel}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPanel("category")}
          className="flex items-center justify-center gap-2 border-r border-white/10 px-2 py-2.5 transition-colors active:bg-white/10"
        >
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="text-[11px] font-bold uppercase tracking-wider">Category</span>
            <span className="w-full truncate text-[10px] text-white/60">
              {activeCategoryName ?? "All"}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPanel("filters")}
          className="flex items-center justify-center gap-2 px-2 py-2.5 transition-colors active:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <BottomSheet open={panel === "sort"} onClose={() => setPanel(null)} title="Sort by">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === currentSort;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectSort(opt.value)}
                className="flex w-full items-center justify-between py-3.5 text-left"
              >
                <span
                  className={`text-sm ${
                    active
                      ? "font-semibold text-brand"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </span>
                {active && (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet open={panel === "category"} onClose={() => setPanel(null)} title="Category">
        {categoryContent}
      </BottomSheet>

      <BottomSheet open={panel === "filters"} onClose={() => setPanel(null)} title="Filters">
        {/* submit bubbles up from the form this wraps: blanking out the
            empty fields first keeps them out of the query string, so a
            shared /browse link reads ?condition=new rather than
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
        >
          {filtersContent}
        </div>
      </BottomSheet>
    </>
  );
}
