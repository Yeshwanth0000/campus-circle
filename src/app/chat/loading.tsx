import Skeleton from "@/components/Skeleton";

export default function ChatListLoading() {
  return (
    <div className="mx-auto w-full max-w-none animate-skeleton-in px-3 py-4 sm:max-w-[min(94vw,72rem)] sm:px-4 sm:py-8">
      <Skeleton className="h-8 w-32" />
      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
