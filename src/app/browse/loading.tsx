import Skeleton from "@/components/Skeleton";

export default function BrowseLoading() {
  return (
    <div className="mx-auto w-full max-w-none animate-skeleton-in px-3 py-3 sm:max-w-[min(94vw,96rem)] sm:px-4 sm:py-6">
      {/* Mirrors the real page's breakpoints exactly — breadcrumb, category
          strip and sidebar all appear at lg, the action bar below it — so
          nothing shifts position when the content arrives. */}
      <Skeleton className="mb-4 hidden h-4 w-24 lg:block" />

      <div className="mb-6 hidden gap-3 overflow-x-auto pb-2 lg:flex">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-20 shrink-0 rounded-xl" />
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden space-y-6 lg:block lg:w-52 lg:shrink-0">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </aside>

        <div className="flex-1">
          <Skeleton className="mb-2.5 h-[46px] w-full rounded-xl lg:hidden" />
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
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
