"use client";

import { useState, useTransition } from "react";
import { saveSearch } from "@/app/actions/savedSearches";
import { toast } from "@/lib/toast";

export default function SaveSearchButton({
  query,
  categoryId,
  condition,
  posted,
}: {
  query?: string;
  categoryId?: string;
  condition?: string;
  posted?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const result = await saveSearch({ query, categoryId, condition, posted });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      setSaved(true);
      toast("Search saved — find it under Saved searches.");
    });
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isPending || saved}
      className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z"
        />
      </svg>
      {saved ? "Saved" : isPending ? "Saving…" : "Save this search"}
    </button>
  );
}
