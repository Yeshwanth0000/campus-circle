"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
