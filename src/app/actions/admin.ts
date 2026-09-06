"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AdminResult = { error: string } | { error: null };

export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed"
): Promise<AdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  // The real gate is RLS ("admins can resolve reports in their college") —
  // this update simply fails silently (0 rows) for a non-admin. Checking
  // here too just gives a real error message instead of a quiet no-op.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return { error: "You don't have permission to do that." };
  }

  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/reports");
  return { error: null };
}
