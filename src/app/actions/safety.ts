"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SafetyResult = { error: string | null; success?: boolean };

const REASON_MAX_LENGTH = 100;
const DETAILS_MAX_LENGTH = 1000;

export async function fileReport(input: {
  reason: string;
  details?: string;
  reportedUserId?: string;
  reportedListingId?: string;
}): Promise<SafetyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  if (!input.reportedUserId && !input.reportedListingId) {
    return { error: "Nothing to report." };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: input.reportedUserId ?? null,
    reported_listing_id: input.reportedListingId ?? null,
    reason: input.reason.trim().slice(0, REASON_MAX_LENGTH),
    details: input.details?.trim().slice(0, DETAILS_MAX_LENGTH) || null,
  });

  if (error) return { error: error.message };
  return { error: null, success: true };
}

export async function blockUser(blockedId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("blocked_users")
    .insert({ blocker_id: user.id, blocked_id: blockedId });

  revalidatePath("/browse");
  revalidatePath("/chat");
}

export async function unblockUser(blockedId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  revalidatePath("/browse");
  revalidatePath("/chat");
}
