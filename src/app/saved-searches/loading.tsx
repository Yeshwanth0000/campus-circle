import Skeleton from "@/components/Skeleton";

export default function SavedSearchesLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-skeleton-in px-4 py-8">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-80" />

      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
