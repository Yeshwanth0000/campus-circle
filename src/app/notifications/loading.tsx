import Skeleton from "@/components/Skeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-skeleton-in px-4 py-8">
      <Skeleton className="h-8 w-40" />

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
        <div className="border-b border-slate-100/70 px-4 py-2 dark:border-slate-800/70">
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <Skeleton className="mt-1.5 h-2 w-2 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
