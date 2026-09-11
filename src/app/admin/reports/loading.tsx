import Skeleton from "@/components/Skeleton";

export default function AdminReportsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-skeleton-in px-4 py-8">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
