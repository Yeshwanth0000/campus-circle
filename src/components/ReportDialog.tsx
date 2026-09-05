"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fileReport } from "@/app/actions/safety";

const REASONS = [
  "Suspicious or scam behavior",
  "Inappropriate content",
  "Prohibited item",
  "Harassment",
  "Something else",
];

export default function ReportDialog({
  userId,
  listingId,
  onClose,
}: {
  userId?: string;
  listingId?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await fileReport({
        reason,
        details: details.trim() || undefined,
        reportedUserId: userId,
        reportedListingId: listingId,
      });
      setDone(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl outline-none dark:bg-slate-900"
      >
        {done ? (
          <>
            <h2 id="report-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Thanks for letting us know</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              We&rsquo;ve logged your report and will look into it.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="report-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Report</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isPending ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
