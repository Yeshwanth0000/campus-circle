"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function startConversation(listingId: string, sellerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (user.id === sellerId) {
    redirect(`/listings/${listingId}`);
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existing) {
    redirect(`/chat/${existing.id}`);
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select("id")
    .single();

  if (error || !created) {
    redirect(`/listings/${listingId}`);
  }

  // "I'm interested" should actually land as a real signal in the chat, not
  // just an empty thread — send a starter message on the buyer's behalf,
  // same pattern as the "Is this available?" auto-message on other
  // marketplace apps' contact-seller buttons.
  await supabase.from("messages").insert({
    conversation_id: created.id,
    sender_id: user.id,
    content: "Hi! I'm interested in this listing — is it still available?",
  });

  redirect(`/chat/${created.id}`);
}

const MESSAGE_MAX_LENGTH = 2000;

export type SentMessage = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
};

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ error: string | null; message?: SentMessage }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };
  const trimmed = content.trim().slice(0, MESSAGE_MAX_LENGTH);
  if (!trimmed) return { error: null };

  // Returning the row lets the sender's optimistic bubble be swapped for the
  // real one instead of waiting on the realtime echo, which can lag on a
  // weak connection.
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select("id, content, sender_id, created_at, read_at")
    .single();

  if (error) {
    return {
      error: error.message.includes("too quickly")
        ? error.message
        : "Message couldn't be sent. Please try again.",
    };
  }
  return { error: null, message: data ?? undefined };
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  // Opening the conversation a "new message" notification points to should
  // clear that notification too — otherwise the bell badge stays stuck on
  // unread even after the message has actually been read here.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("type", "new_message")
    .eq("payload->>conversation_id", conversationId)
    .is("read_at", null);
}
