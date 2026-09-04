import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import ProfileEditForm from "./ProfileEditForm";
import UnblockButton from "@/components/UnblockButton";
import DeleteAccountSection from "@/components/DeleteAccountSection";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, hostel_or_branch, colleges(name)")
    .eq("id", user.id)
    .single();

  const { data: myListings } = await supabase
    .from("listings")
    .select("id, title, price, images, status, condition, created_at, categories(name)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const { data: blocked } = await supabase
    .from("blocked_users")
    .select("blocked_id, profiles!blocked_users_blocked_id_fkey(full_name)")
    .eq("blocker_id", user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {profile?.full_name ?? "Your profile"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {profile?.colleges?.name} community
          {profile?.hostel_or_branch ? ` · ${profile.hostel_or_branch}` : ""}
        </p>
        <ProfileEditForm
          fullName={profile?.full_name ?? ""}
          hostelOrBranch={profile?.hostel_or_branch ?? ""}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My listings</h2>
        <Link
          href="/sell"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + New listing
        </Link>
      </div>

      {myListings && myListings.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {myListings.map((listing) => (
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
              hideSave
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          You haven&rsquo;t posted anything yet.
        </div>
      )}

      {blocked && blocked.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Blocked users</h2>
          <ul className="mt-3 max-w-sm space-y-2">
            {blocked.map((b) => (
              <li
                key={b.blocked_id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <span className="text-slate-700 dark:text-slate-300">{b.profiles?.full_name ?? "Student"}</span>
                <UnblockButton userId={b.blocked_id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <DeleteAccountSection />
    </div>
  );
}
