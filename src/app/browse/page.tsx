import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import Reveal from "@/components/Reveal";
import SaveSearchButton from "@/components/SaveSearchButton";
import { categoryIcon } from "@/lib/categoryIcons";
import MobileActionBar from "./MobileActionBar";

type SearchParams = Promise<{
  category?: string;
  q?: string;
  sort?: string;
  price_min?: string;
  price_max?: string;
  condition?: string;
  posted?: string;
  page?: string;
}>;

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PRICE_PRESETS: { label: string; min: string; max?: string }[] = [
  { label: "Under ₹500", min: "0", max: "500" },
  { label: "₹500–2,000", min: "500", max: "2000" },
  { label: "₹2,000+", min: "2000" },
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { category, q } = await searchParams;
  if (q) {
    return { title: `“${q}” — Browse — CampusBin` };
  }
  if (category) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", category)
      .maybeSingle();
    if (data?.name) {
      return { title: `${data.name} — Browse — CampusBin` };
    }
  }
  return { title: "Browse — CampusBin" };
}

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
    page: pageRaw,
  } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageRaw)) || 1);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: blockedRows }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
  ]);
  const blockedIds = new Set(blockedRows?.map((r) => r.blocked_id));

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, images, status, condition, created_at, seller_id, categories(name, slug)",
      { count: "exact" }
    )
    .eq("status", "available");
  if (blockedIds.size > 0) {
    query = query.not("seller_id", "in", `(${Array.from(blockedIds).join(",")})`);
  }

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

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const [{ data: listings, count: totalCount }, { data: savedRows }] = await Promise.all([
    query,
    supabase.from("saved_listings").select("listing_id").eq("user_id", user.id),
  ]);

  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));
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
  const mobileFilterCount = [
    Boolean(activeCategory),
    Boolean(condition),
    Boolean(posted),
    Boolean(price_min || price_max),
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-[min(94vw,96rem)] px-4 py-6">
      {/* Breadcrumb and the category tile strip are desktop-only: on phones
          the action bar's Category sheet covers the same ground, and both
          were spending most of the first screen on navigation. */}
      <nav className="mb-4 hidden items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 sm:flex">
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

      {/* Category tile strip — the fade masks hint that the row keeps
          going past either edge, since overflow-x-auto alone gives no
          visual cue there's more to scroll to on a narrow screen. */}
      <div className="mb-6 hidden gap-3 overflow-x-auto pb-2 sm:flex [-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)] [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
        <Link
          href={buildUrl({ category: undefined })}
          aria-current={!category ? "true" : undefined}
          className={categoryTileClass(!category)}
        >
          <span
            aria-hidden
            className="text-2xl transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100"
          >
            🛍️
          </span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">All</span>
          <span
            aria-hidden
            className={`absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-brand transition-transform duration-300 ease-out ${
              !category ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </Link>
        {categories?.map((c) => (
          <Link
            key={c.id}
            href={buildUrl({ category: c.slug })}
            aria-current={category === c.slug ? "true" : undefined}
            className={categoryTileClass(category === c.slug)}
          >
            <span
              aria-hidden
              className="text-2xl transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100"
            >
              {categoryIcon(c.slug)}
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
            <span
              aria-hidden
              className={`absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-brand transition-transform duration-300 ease-out ${
                category === c.slug ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Mobile gets its own compact dropdown (MobileFilterPanel, rendered
            in the results header below) instead of this full sidebar, so
            the listing grid isn't pushed down by a wall of price/condition/
            posted controls. Desktop keeps the always-visible sidebar. */}
        <aside className="hidden space-y-6 sm:block sm:w-52 sm:shrink-0">
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
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const active = price_min === preset.min && price_max === (preset.max ?? undefined);
                return (
                  <Link
                    key={preset.label}
                    href={buildUrl({ price_min: preset.min, price_max: preset.max })}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand-light text-brand-dark dark:border-brand dark:bg-brand/15 dark:text-brand"
                        : "border-slate-200 text-slate-600 hover:border-brand/40 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {preset.label}
                  </Link>
                );
              })}
            </div>
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

        <div className="order-1 flex-1 sm:order-none">
          {/* Sort / Category / Filters — first thing on the page for
              phones, replacing the breadcrumb and category strip that used
              to sit here. Its three sheets are fed from here so the option
              lists stay server-rendered. */}
          <MobileActionBar
            currentSort={sort}
            activeFilterCount={mobileFilterCount}
            activeCategoryName={activeCategory?.name}
            categoryContent={
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                <li>
                  <Link
                    href={buildUrl({ category: undefined })}
                    className={`flex items-center gap-3 py-3.5 text-sm ${
                      !category
                        ? "font-semibold text-brand"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span aria-hidden className="text-xl">
                      🛍️
                    </span>
                    All categories
                  </Link>
                </li>
                {categories?.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={buildUrl({ category: c.slug })}
                      className={`flex items-center gap-3 py-3.5 text-sm ${
                        category === c.slug
                          ? "font-semibold text-brand"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span aria-hidden className="text-xl">
                        {categoryIcon(c.slug)}
                      </span>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            }
            filtersContent={
              <form action="/browse" method="get">
                {q && <input type="hidden" name="q" value={q} />}
                {sort && sort !== "newest" && <input type="hidden" name="sort" value={sort} />}

                <FilterGroup label="Price range">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="price_min"
                        min="0"
                        inputMode="numeric"
                        defaultValue={price_min}
                        placeholder="Min"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm text-slate-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">–</span>
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="price_max"
                        min="0"
                        inputMode="numeric"
                        defaultValue={price_max}
                        placeholder="Max"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm text-slate-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </FilterGroup>

                <FilterGroup label="Condition">
                  <div className="grid grid-cols-3 gap-2">
                    <ChoiceChip name="condition" value="" label="Any" checked={!condition} />
                    {CONDITIONS.map((c) => (
                      <ChoiceChip
                        key={c.value}
                        name="condition"
                        value={c.value}
                        label={c.label}
                        checked={condition === c.value}
                      />
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label="Posted">
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceChip name="posted" value="" label="Any time" checked={!posted} />
                    {POSTED_OPTIONS.map((p) => (
                      <ChoiceChip
                        key={p.value}
                        name="posted"
                        value={p.value}
                        label={p.label}
                        checked={posted === p.value}
                      />
                    ))}
                  </div>
                </FilterGroup>

                {/* Category has its own sheet on the action bar, so it's
                    carried through as a hidden field rather than repeated
                    as a second control here. */}
                {category && <input type="hidden" name="category" value={category} />}

                <div className="sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-slate-100 bg-white/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                  {mobileFilterCount > 0 && (
                    <Link
                      href={buildUrl({
                        category: undefined,
                        price_min: undefined,
                        price_max: undefined,
                        condition: undefined,
                        posted: undefined,
                      })}
                      className="flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      Clear all
                    </Link>
                  )}
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark"
                  >
                    Show results
                  </button>
                </div>
              </form>
            }
          />

          {hasAnyFilter && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {activeCategory && (
                <FilterChip label={activeCategory.name} href={buildUrl({ category: undefined })} />
              )}
              {q && <FilterChip label={`"${q}"`} href={buildUrl({ q: undefined })} />}
              {(price_min || price_max) && (
                <FilterChip
                  label={
                    price_min && price_max
                      ? `₹${price_min}–${price_max}`
                      : price_min
                        ? `₹${price_min}+`
                        : `Up to ₹${price_max}`
                  }
                  href={buildUrl({ price_min: undefined, price_max: undefined })}
                />
              )}
              {condition && (
                <FilterChip
                  label={CONDITIONS.find((c) => c.value === condition)?.label ?? condition}
                  href={buildUrl({ condition: undefined })}
                />
              )}
              {posted && (
                <FilterChip
                  label={POSTED_OPTIONS.find((p) => p.value === posted)?.label ?? posted}
                  href={buildUrl({ posted: undefined })}
                />
              )}
              <Link
                href="/browse"
                className="ml-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                Clear all
              </Link>
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {listings?.length ?? 0} of {totalCount ?? 0} result{totalCount === 1 ? "" : "s"}
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
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <label htmlFor="sort" className="text-slate-500 dark:text-slate-400">
                  Sort by
                </label>
                <SortSelect current={sort} buildUrl={buildUrl} />
              </div>
            </div>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((listing, i) => (
                <Reveal key={listing.id} delay={(i % 4) * 60}>
                  <ListingCard
                    id={listing.id}
                    title={listing.title}
                    price={Number(listing.price)}
                    images={listing.images}
                    status={listing.status}
                    categoryName={listing.categories?.name}
                    condition={listing.condition}
                    createdAt={listing.created_at}
                    saved={savedIds.has(listing.id)}
                    sellerId={listing.seller_id}
                    hideInterested={listing.seller_id === user.id}
                  />
                </Reveal>
              ))}
            </div>
          ) : null}

          {listings && listings.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href={buildUrl({ page: page > 1 ? String(page - 1) : undefined })}
                aria-disabled={page <= 1}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  page <= 1
                    ? "pointer-events-none text-slate-300 dark:text-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                ← Previous
              </Link>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Link
                href={buildUrl({ page: page < totalPages ? String(page + 1) : undefined })}
                aria-disabled={page >= totalPages}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  page >= totalPages
                    ? "pointer-events-none text-slate-300 dark:text-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                Next →
              </Link>
            </div>
          )}

          {(!listings || listings.length === 0) && (hasAnyFilter ? (
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
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-5 first:pt-1 dark:border-slate-800">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </h3>
      {children}
    </div>
  );
}

// A radio styled as a tappable chip — keeps the whole sheet a plain GET
// form (no client state to sync) while still reading as a modern control
// rather than a stack of native radio buttons.
function ChoiceChip({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-600 transition-colors peer-checked:border-brand peer-checked:bg-brand-light peer-checked:font-semibold peer-checked:text-brand-dark peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:peer-checked:border-brand dark:peer-checked:bg-brand/15 dark:peer-checked:text-brand">
        {label}
      </span>
    </label>
  );
}

function categoryTileClass(active: boolean) {
  return `group relative flex shrink-0 flex-col items-center gap-1.5 overflow-hidden rounded-2xl border px-4 py-3 text-center backdrop-blur-sm transition-all duration-300 ease-out ${
    active
      ? "border-brand/40 bg-brand-light/80 shadow-sm shadow-brand/10 dark:border-brand/30 dark:bg-brand/15"
      : "border-slate-200/70 bg-white/70 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:shadow-md hover:shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/60 dark:hover:border-brand/25 dark:hover:bg-slate-900/90 dark:hover:shadow-black/30"
  }`;
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

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark transition-colors hover:bg-brand/20 dark:bg-brand/15 dark:text-brand"
    >
      {label}
      <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </Link>
  );
}
