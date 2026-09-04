import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import SafetyMenu from "@/components/SafetyMenu";

export default async function SellerProfilePage({
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

  const { data: seller } = await supabase
    .from("profiles")
    .select("id, full_name, hostel_or_branch, created_at")
    .eq("id", id)
    .single();

  if (!seller) notFound();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, images, status, condition, created_at, categories(name)")
    .eq("seller_id", id)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const { data: savedRows } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id);
  const savedIds = new Set(savedRows?.map((r) => r.listing_id));

  const { data: blockedRow } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", id)
    .maybeSingle();

  const memberSince = new Date(seller.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-light text-xl font-bold text-brand-dark">
            {(seller.full_name ?? "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {seller.full_name ?? "Student"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {seller.hostel_or_branch ? `${seller.hostel_or_branch} · ` : ""}
              Member since {memberSince}
            </p>
          </div>
        </div>
        {seller.id !== user.id && (
          <SafetyMenu userId={seller.id} initialBlocked={!!blockedRow} />
        )}
      </div>

      <h2 className="mt-8 mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
        {listings?.length ?? 0} active listing{listings?.length === 1 ? "" : "s"}
      </h2>

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
              condition={listing.condition}
              createdAt={listing.created_at}
              categoryName={listing.categories?.name}
              saved={savedIds.has(listing.id)}
              hideSave={seller.id === user.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No active listings right now.
        </div>
      )}

      <Link
        href="/browse"
        className="mt-6 inline-block text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Back to browsing
      </Link>
    </div>
  );
}
