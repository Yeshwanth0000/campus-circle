"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReport } from "@/app/actions/admin";
import { toast } from "@/lib/toast";

export default function ReportActions({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(status: "resolved" | "dismissed") {
    startTransition(async () => {
      const result = await resolveReport(reportId, status);
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast(status === "resolved" ? "Marked resolved." : "Dismissed.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handle("dismissed")}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Dismiss
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handle("resolved")}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Mark resolved
      </button>
    </div>
  );
}
