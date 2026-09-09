import Skeleton from "@/components/Skeleton";

const BUBBLE_WIDTHS = ["w-40", "w-56", "w-32", "w-48", "w-24"];

export default function ChatThreadLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-178px)] w-full max-w-[min(94vw,72rem)] animate-skeleton-in flex-col px-4 py-4 sm:h-[calc(100vh-126px)] lg:h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/60">
        {BUBBLE_WIDTHS.map((width, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-9 ${width} rounded-2xl`} />
          </div>
        ))}
      </div>

      <Skeleton className="mt-3 h-12 w-full shrink-0 rounded-xl" />
    </div>
  );
}
