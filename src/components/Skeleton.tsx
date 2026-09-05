export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
    >
      <div className="skeleton-shimmer absolute inset-0" />
    </div>
  );
}
