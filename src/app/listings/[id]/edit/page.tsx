import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditListingForm from "./EditListingForm";

export default async function EditListingPage({
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
      "id, title, description, price, condition, images, meetup_spot, category_id, seller_id, custom_fields"
    )
    .eq("id", id)
    .single();

  if (!listing) notFound();
  if (listing.seller_id !== user.id) redirect(`/listings/${id}`);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit listing</h1>
      <EditListingForm listing={listing} categories={categories ?? []} />
    </div>
  );
}
