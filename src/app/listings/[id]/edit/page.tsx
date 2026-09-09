import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import EditListingForm from "./EditListingForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  return {
    title: listing?.title
      ? `Edit “${listing.title}” — CampusCircle`
      : "Edit listing — CampusCircle",
  };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // None of these three depend on each other — categories is global data,
  // and listing only needs `id` — so they run concurrently.
  const [
    {
      data: { user },
    },
    { data: listing },
    { data: categories },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("listings")
      .select(
        "id, title, description, price, condition, images, meetup_spot, category_id, seller_id, custom_fields"
      )
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  if (!user) redirect("/login");
  if (!listing) notFound();
  if (listing.seller_id !== user.id) redirect(`/listings/${id}`);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit listing</h1>
      <EditListingForm listing={listing} categories={categories ?? []} />
    </div>
  );
}
