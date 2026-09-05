import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import SaveSearchButton from "@/components/SaveSearchButton";
import { categoryIcon } from "@/lib/categoryIcons";

type SearchParams = Promise<{
  category?: string;
  q?: string;
  sort?: string;
  price_min?: string;
  price_max?: string;
  condition?: string;
  posted?: string;
}>;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const POSTED_OPTIONS = [
  { value: "today", label: "Today", hours: 24 },
  { value: "week", label: "This week", hours: 24 * 7 },
  { value: "month", label: "This month", hours: 24 * 30 },
];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const {
    category,
    q,
    sort = "newest",
    price_min,
    price_max,
    condition,
    posted,
  } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, images, status, condition, created_at, seller_id, categories(name, slug)"
    )
    .eq("status", "available");

  const activeCategory = categories?.find((c) => c.slug === category);
  if (activeCategory) {
    query = query.eq("category_id", activeCategory.id);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }
  if (price_min) {
    query = query.gte("price", Number(price_min));
  }
  if (price_max) {
    query = query.lte("price", Number(price_max));
  }
  if (condition) {
    query = query.eq("condition", condition);
  }
  const postedOption = POSTED_OPTIONS.find((p) => p.value === posted);
  if (postedOption) {
    const since = new Date(Date.now() - postedOption.hours * 60 * 60 * 1000);
    query = query.gte("created_at", since.toISOString());
  }

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const [{ data: listingsRaw }, { data: savedRows }, { data: blockedRows }] = await Promise.all([
    query,
    supabase.from("saved_listings").select("listing_id").eq("user_id", user.id),
    supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
  ]);

  const blockedIds = new Set(blockedRows?.map((r) => r.blocked_id));
  const listings = listingsRaw?.filter((l) => !blockedIds.has(l.seller_id));
  const savedIds = new Set(savedRows?.map((r) => r.listing_id));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { category, q, sort, price_min, price_max, condition, posted, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `/browse${qs ? `?${qs}` : ""}`;
  }

  const hasExtraFilters = condition || posted;
  const hasAnyFilter = Boolean(
    activeCategory || q || price_min || price_max || condition || posted
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/browse" className="hover:text-brand">
          Home
        </Link>
        {activeCategory && (
          <>
            <span>/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{activeCategory.name}</span>
          </>
        )}
        {q && !activeCategory && (
          <>
            <span>/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">&ldquo;{q}&rdquo;</span>
          </>
        )}
      </nav>

      {/* Category tile strip */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        <Link
          href={buildUrl({ category: undefined })}
          aria-current={!category ? "true" : undefined}
          className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition ${
            !category
              ? "border-brand bg-brand-light"
              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          }`}
        >
          <span className="text-2xl">🛍️</span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">All</span>
        </Link>
        {categories?.map((c) => (
          <Link
            key={c.id}
            href={buildUrl({ category: c.slug })}
            aria-current={category === c.slug ? "true" : undefined}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition ${
              category === c.slug
                ? "border-brand bg-brand-light"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            }`}
          >
            <span className="text-2xl">{categoryIcon(c.slug)}</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
          </Link>
        ))}
      </div>

      {!category && !q && <RecentlyViewed excludeIds={listings?.map((l) => l.id) ?? []} />}

      <div className="flex flex-col gap-6 sm:flex-row">
        <aside className="space-y-6 sm:w-52 sm:shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Price range</h2>
            <form className="mt-3 space-y-2">
              {category && <input type="hidden" name="category" value={category} />}
              {q && <input type="hidden" name="q" value={q} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {condition && <input type="hidden" name="condition" value={condition} />}
              {posted && <input type="hidden" name="posted" value={posted} />}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="price_min"
                  min="0"
                  defaultValue={price_min}
                  placeholder="Min"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-400 dark:text-slate-500">–</span>
                <input
                  type="number"
                  name="price_max"
                  min="0"
                  defaultValue={price_max}
                  placeholder="Max"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Apply
              </button>
            </form>
            <Link
              href={buildUrl({ price_min: undefined, price_max: undefined })}
              className="mt-2 inline-block text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Clear price filter
            </Link>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Condition</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CONDITIONS.map((c) => (
                <Link
                  key={c.value}
                  href={buildUrl({ condition: condition === c.value ? undefined : c.value })}
                  aria-current={condition === c.value ? "true" : undefined}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    condition === c.value
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Posted</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {POSTED_OPTIONS.map((p) => (
                <Link
                  key={p.value}
                  href={buildUrl({ posted: posted === p.value ? undefined : p.value })}
                  aria-current={posted === p.value ? "true" : undefined}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    posted === p.value
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          {hasExtraFilters && (
            <Link
              href={buildUrl({ condition: undefined, posted: undefined })}
              className="inline-block text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Clear condition/date filters
            </Link>
          )}

          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Category</h2>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <Link
                  href={buildUrl({ category: undefined })}
                  aria-current={!category ? "true" : undefined}
                  className={`block rounded-md px-2 py-1.5 ${
                    !category
                      ? "bg-brand-light font-semibold text-brand-dark"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories?.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildUrl({ category: c.slug })}
                    aria-current={category === c.slug ? "true" : undefined}
                    className={`block rounded-md px-2 py-1.5 ${
                      category === c.slug
                        ? "bg-brand-light font-semibold text-brand-dark"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {listings?.length ?? 0} result{listings?.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-3">
              {hasAnyFilter && (
                <SaveSearchButton
                  query={q}
                  categoryId={activeCategory?.id}
                  condition={condition}
                  posted={posted}
                />
              )}
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="sort" className="text-slate-500 dark:text-slate-400">
                  Sort by
                </label>
                <SortSelect current={sort} buildUrl={buildUrl} />
              </div>
            </div>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={Number(listing.price)}
                  images={listing.images}
                  status={listing.status}
                  categoryName={listing.categories?.name}
                  condition={listing.condition}
                  createdAt={listing.created_at}
                  saved={savedIds.has(listing.id)}
                />
              ))}
            </div>
          ) : hasAnyFilter ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No listings match your filters.{" "}
              <Link href="/browse" className="font-semibold text-brand">
                Clear all filters
              </Link>{" "}
              or{" "}
              <Link href="/sell" className="font-semibold text-brand">
                sell something
              </Link>
              !
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nothing here yet — be the first to post{activeCategory ? ` in ${activeCategory.name}` : ""}.{" "}
              <Link href="/sell" className="font-semibold text-brand">
                Sell something
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortSelect({
  current,
  buildUrl,
}: {
  current: string;
  buildUrl: (overrides: Record<string, string | undefined>) => string;
}) {
  return (
    <div className="flex gap-1">
      {SORT_OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={buildUrl({ sort: opt.value })}
          aria-current={current === opt.value ? "true" : undefined}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
            current === opt.value
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
