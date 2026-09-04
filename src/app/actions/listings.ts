"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ListingResult = { error: string } | { error: null };

export async function createListing(
  _prevState: ListingResult | null,
  formData: FormData
): Promise<ListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "0");
  const price = Number(priceRaw);
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const condition = String(formData.get("condition") ?? "") || null;
  const meetupSpot = String(formData.get("meetupSpot") ?? "").trim() || null;
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (!title || Number.isNaN(price) || price < 0) {
    return { error: "Please provide a title and a valid price." };
  }
  if (files.length > 5) {
    return { error: "You can upload at most 5 photos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("college_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return { error: "Your profile could not be found." };
  }

  const imageUrls: string[] = [];
  for (const file of files) {
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, file);
    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` };
    }
    const { data: publicUrl } = supabase.storage
      .from("listing-images")
      .getPublicUrl(path);
    imageUrls.push(publicUrl.publicUrl);
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      college_id: profile.college_id,
      title,
      description,
      price,
      category_id: categoryId,
      condition,
      meetup_spot: meetupSpot,
      images: imageUrls,
    })
    .select("id")
    .single();

  if (error || !listing) {
    return { error: error?.message ?? "Could not create listing." };
  }

  redirect(`/listings/${listing.id}`);
}

export async function updateListing(
  _prevState: ListingResult | null,
  formData: FormData
): Promise<ListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const listingId = String(formData.get("listingId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "0");
  const price = Number(priceRaw);
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const condition = String(formData.get("condition") ?? "") || null;
  const meetupSpot = String(formData.get("meetupSpot") ?? "").trim() || null;
  const keptImages = formData.getAll("keptImages").map(String);
  const newFiles = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!listingId || !title || Number.isNaN(price) || price < 0) {
    return { error: "Please provide a title and a valid price." };
  }
  if (keptImages.length + newFiles.length > 5) {
    return { error: "You can have at most 5 photos total." };
  }

  const imageUrls: string[] = [...keptImages];
  for (const file of newFiles) {
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, file);
    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` };
    }
    const { data: publicUrl } = supabase.storage
      .from("listing-images")
      .getPublicUrl(path);
    imageUrls.push(publicUrl.publicUrl);
  }

  const { error } = await supabase
    .from("listings")
    .update({
      title,
      description,
      price,
      category_id: categoryId,
      condition,
      meetup_spot: meetupSpot,
      images: imageUrls,
    })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/profile");
  revalidatePath("/browse");
  redirect(`/listings/${listingId}`);
}

export async function markAsSold(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  revalidatePath("/profile");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/browse");
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("seller_id", user.id);

  revalidatePath("/profile");
  revalidatePath("/browse");
}
