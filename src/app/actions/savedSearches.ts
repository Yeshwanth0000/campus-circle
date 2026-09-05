"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSearch(params: {
  query?: string;
  categoryId?: string;
  condition?: string;
  posted?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    query: params.query || null,
    category_id: params.categoryId || null,
    condition: params.condition || null,
    posted: params.posted || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/saved-searches");
  return { error: null };
}

export async function deleteSavedSearch(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/saved-searches");
}

export async function touchSavedSearch(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_searches")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
}
