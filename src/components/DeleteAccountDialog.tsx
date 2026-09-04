"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/profile";
import { toast } from "@/lib/toast";

export default function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  useEffect(() => {
    panelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleDelete() {
    if (!canDelete) return;
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) toast(result.error, "error");
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
        aria-labelledby="delete-account-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl outline-none dark:bg-slate-900"
      >
        <h2 id="delete-account-title" className="text-lg font-bold text-red-600 dark:text-red-400">
          Delete your account?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This permanently deletes your profile, listings, messages, and saved items. This
          can&rsquo;t be undone.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Type <span className="font-mono font-bold">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
