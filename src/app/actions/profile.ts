"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProfileResult = { error: string } | { error: null };

export async function updateProfile(
  _prevState: ProfileResult | null,
  formData: FormData
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const hostelOrBranch = String(formData.get("hostelOrBranch") ?? "").trim();

  if (!fullName) {
    return { error: "Name can't be empty." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, hostel_or_branch: hostelOrBranch || null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/browse");
  return { error: null };
}

export type ExportedData = {
  exportedAt: string;
  profile: {
    fullName: string | null;
    hostelOrBranch: string | null;
    email: string | undefined;
    accountCreatedAt: string | undefined;
  };
  listings: Array<{
    title: string;
    description: string | null;
    price: number;
    condition: string | null;
    status: string;
    createdAt: string;
  }>;
  savedListings: Array<{ title: string | undefined; savedAt: string }>;
  conversations: Array<{
    withWhom: string | null;
    aboutListing: string | undefined;
    messages: Array<{ sentByMe: boolean; content: string; sentAt: string }>;
  }>;
};

export async function exportMyData(): Promise<
  { error: string; data: null } | { error: null; data: ExportedData }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in.", data: null };
  }

  const [profileRes, listingsRes, savedRes, conversationsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, hostel_or_branch, created_at").eq("id", user.id).single(),
    supabase
      .from("listings")
      .select("title, description, price, condition, status, created_at")
      .eq("seller_id", user.id),
    supabase
      .from("saved_listings")
      .select("created_at, listings(title)")
      .eq("user_id", user.id),
    supabase
      .from("conversations")
      .select(
        "listing:listings(title), buyer:profiles!conversations_buyer_id_fkey(id, full_name), seller:profiles!conversations_seller_id_fkey(id, full_name), messages(content, sender_id, created_at)"
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
  ]);

  const data: ExportedData = {
    exportedAt: new Date().toISOString(),
    profile: {
      fullName: profileRes.data?.full_name ?? null,
      hostelOrBranch: profileRes.data?.hostel_or_branch ?? null,
      email: user.email,
      accountCreatedAt: profileRes.data?.created_at,
    },
    listings: (listingsRes.data ?? []).map((l) => ({
      title: l.title,
      description: l.description,
      price: Number(l.price),
      condition: l.condition,
      status: l.status,
      createdAt: l.created_at,
    })),
    savedListings: (savedRes.data ?? []).map((s) => ({
      title: s.listings?.title,
      savedAt: s.created_at,
    })),
    conversations: (conversationsRes.data ?? []).map((c) => {
      const otherPerson = c.buyer?.id === user.id ? c.seller : c.buyer;
      return {
        withWhom: otherPerson?.full_name ?? null,
        aboutListing: c.listing?.title,
        messages: (c.messages ?? []).map((m) => ({
          sentByMe: m.sender_id === user.id,
          content: m.content,
          sentAt: m.created_at,
        })),
      };
    }),
  };

  return { error: null, data };
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    return { error: "Couldn't delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/");
}
