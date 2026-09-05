import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startConversation } from "@/app/actions/chat";
import { markAsSold, deleteListing, relistListing } from "@/app/actions/listings";
import ImageGallery from "@/components/ImageGallery";
import ListingCard from "@/components/ListingCard";
import SaveButton from "@/components/SaveButton";
import SafetyMenu from "@/components/SafetyMenu";
import ViewTracker from "@/components/ViewTracker";
import RelistButton from "@/components/RelistButton";
import { getCategoryFields } from "@/lib/categoryFields";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, condition, images, meetup_spot, status, created_at, seller_id, category_id, view_count, custom_fields, categories(name, slug), profiles(full_name, hostel_or_branch, created_at)"
    )
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const isOwner = listing.seller_id === user.id;

  const { data: savedRow } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", id)
    .maybeSingle();

  const { count: sellerListingsCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", listing.seller_id);

  const { data: blockedRow } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", listing.seller_id)
    .maybeSingle();

  const { data: relatedListings } = listing.category_id
    ? await supabase
        .from("listings")
        .select("id, title, price, images, status, condition, created_at, categories(name)")
        .eq("category_id", listing.category_id)
        .eq("status", "available")
        .neq("id", id)
        .limit(4)
    : { data: null };

  async function messageSeller() {
    "use server";
    await startConversation(listing!.id, listing!.seller_id);
  }

  async function handleMarkAsSold() {
    "use server";
    await markAsSold(id);
  }

  async function handleDelete() {
    "use server";
    await deleteListing(id);
    redirect("/profile");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ViewTracker listingId={id} />
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/browse" className="hover:text-brand">
          Home
        </Link>
        {listing.categories?.slug && (
          <>
            <span>/</span>
            <Link
              href={`/browse?category=${listing.categories.slug}`}
              className="hover:text-brand"
            >
              {listing.categories.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate font-medium text-slate-700 dark:text-slate-300">{listing.title}</span>
      </nav>

      <div className="grid gap-8 sm:grid-cols-2">
        <ImageGallery images={listing.images} title={listing.title} />

        <div>
          {listing.status === "sold" && (
            <span className="mb-2 inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-700">
              Sold
            </span>
          )}
          {listing.status === "expired" && (
            <span className="mb-2 inline-block rounded-full bg-slate-500 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-600">
              Expired — no longer shown in Browse
            </span>
          )}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{listing.title}</h1>
            {!isOwner && (
              <div className="flex shrink-0 items-center gap-1">
                <SaveButton listingId={id} initialSaved={!!savedRow} />
                <SafetyMenu
                  userId={listing.seller_id}
                  listingId={id}
                  initialBlocked={!!blockedRow}
                />
              </div>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-brand">
            {Number(listing.price) > 0
              ? `₹${Number(listing.price).toLocaleString("en-IN")}`
              : "Free"}
          </p>

          {isOwner && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {listing.view_count === 0
                ? "No views yet"
                : `${listing.view_count} view${listing.view_count === 1 ? "" : "s"}`}{" "}
              · only you can see this
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {listing.categories?.name && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {listing.categories.name}
              </span>
            )}
            {listing.condition && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                {listing.condition.replace("-", " ")}
              </span>
            )}
          </div>

          {listing.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {listing.description}
            </p>
          )}

          {(() => {
            const fieldDefs = getCategoryFields(listing.categories?.slug);
            const customFields = (listing.custom_fields ?? {}) as Record<string, string>;
            const entries = fieldDefs
              .map((def) => ({ label: def.label, value: customFields[def.key] }))
              .filter((entry) => entry.value);
            if (entries.length === 0) return null;
            return (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                {entries.map((entry) => (
                  <div key={entry.label}>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{entry.label}</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            );
          })()}

          {listing.meetup_spot && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Suggested meetup:</span>{" "}
              {listing.meetup_spot}
            </p>
          )}

          <Link
            href={`/sellers/${listing.seller_id}`}
            className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm transition hover:border-brand hover:bg-brand-light/40 dark:border-slate-800"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
              {(listing.profiles?.full_name ?? "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {listing.profiles?.full_name ?? "Student"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {listing.profiles?.hostel_or_branch
                  ? `${listing.profiles.hostel_or_branch} · `
                  : ""}
                {sellerListingsCount ?? 0} listing
                {sellerListingsCount === 1 ? "" : "s"}
              </p>
            </div>
          </Link>

          <div className="mt-6 space-y-2">
            {isOwner ? (
              <>
                {listing.status === "available" && (
                  <>
                    <Link
                      href={`/listings/${id}/edit`}
                      className="block w-full rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Edit listing
                    </Link>
                    <form action={handleMarkAsSold}>
                      <button
                        type="submit"
                        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                      >
                        Mark as sold
                      </button>
                    </form>
                  </>
                )}
                {(listing.status === "sold" || listing.status === "expired") && (
                  <RelistButton listingId={id} />
                )}
                <form action={handleDelete}>
                  <button
                    type="submit"
                    className="w-full rounded-md border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Delete listing
                  </button>
                </form>
              </>
            ) : (
              listing.status === "available" && (
                <form action={messageSeller}>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-dark"
                  >
                    Message seller
                  </button>
                </form>
              )
            )}
            <Link
              href="/browse"
              className="block text-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Back to browsing
            </Link>
          </div>
        </div>
      </div>

      {relatedListings && relatedListings.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">More in this category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedListings.map((r) => (
              <ListingCard
                key={r.id}
                id={r.id}
                title={r.title}
                price={Number(r.price)}
                images={r.images}
                status={r.status}
                condition={r.condition}
                createdAt={r.created_at}
                categoryName={r.categories?.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
