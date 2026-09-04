import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: saved } = await supabase
    .from("saved_listings")
    .select(
      "listing_id, listings(id, title, price, images, status, condition, created_at, categories(name))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = saved?.map((s) => s.listings).filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Saved items</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Things you&rsquo;ve bookmarked to check out later.</p>

      {listings.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing!.id}
              id={listing!.id}
              title={listing!.title}
              price={Number(listing!.price)}
              images={listing!.images}
              status={listing!.status}
              condition={listing!.condition}
              createdAt={listing!.created_at}
              categoryName={listing!.categories?.name}
              saved
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nothing saved yet. Tap the heart on any listing to save it here.{" "}
          <Link href="/browse" className="font-semibold text-brand">
            Browse listings
          </Link>
        </div>
      )}
    </div>
  );
}
