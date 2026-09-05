import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand-dark dark:bg-slate-800 dark:text-slate-500">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
