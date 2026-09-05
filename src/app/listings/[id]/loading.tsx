import Skeleton from "@/components/Skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-skeleton-in px-4 py-6">
      <Skeleton className="mb-4 h-4 w-48" />

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
