import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        The listing or page you&rsquo;re looking for may have been removed or
        never existed.
      </p>
      <Link
        href="/browse"
        className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Back to browsing
      </Link>
    </div>
  );
}
