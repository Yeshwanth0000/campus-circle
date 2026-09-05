import Skeleton from "@/components/Skeleton";

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-skeleton-in px-4 py-6">
      <Skeleton className="mb-4 h-4 w-24" />

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-20 shrink-0 rounded-xl" />
        ))}
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <aside className="space-y-6 sm:w-52 sm:shrink-0">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </aside>

        <div className="flex-1">
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
