"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        This page hit a snag
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        It&rsquo;s not you — something broke on our end. Try again, or head back to
        browsing.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Try again
        </button>
        <Link
          href="/browse"
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Back to browsing
        </Link>
      </div>
    </div>
  );
}
