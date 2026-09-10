import Skeleton from "@/components/Skeleton";

export default function SellerProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-none animate-skeleton-in px-3 py-4 sm:max-w-[min(94vw,96rem)] sm:px-4 sm:py-8">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-6 dark:border-slate-800">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>

      <Skeleton className="mt-8 mb-4 h-6 w-40" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
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
