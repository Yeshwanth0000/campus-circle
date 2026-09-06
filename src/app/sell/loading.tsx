import Skeleton from "@/components/Skeleton";

export default function SellLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-skeleton-in px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-1.5">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="mx-auto h-2.5 w-12" />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Skeleton className="mb-1 h-3.5 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3.5 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <Skeleton className="mt-6 h-11 w-full" />
    </div>
  );
}
