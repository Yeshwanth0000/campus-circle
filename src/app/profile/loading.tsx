import Skeleton from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-[min(94vw,96rem)] animate-skeleton-in px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-28 w-full rounded-none sm:h-36" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4">
            <Skeleton className="-mt-10 h-20 w-20 shrink-0 rounded-full sm:-mt-12 sm:h-24 sm:w-24" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
          <Skeleton className="mt-3 h-3.5 w-56" />
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-slate-200/70 pt-5 dark:border-slate-800/70 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Skeleton className="mt-8 mb-4 h-6 w-32" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
