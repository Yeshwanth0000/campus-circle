import Skeleton from "@/components/Skeleton";

export default function SavedLoading() {
  return (
    <div className="mx-auto w-full max-w-[min(94vw,96rem)] animate-skeleton-in px-4 py-8">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
