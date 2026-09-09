import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markConversationRead } from "@/app/actions/chat";
import ChatThread from "./ChatThread";
import SafetyMenu from "@/components/SafetyMenu";
import Avatar from "@/components/Avatar";

const DEFAULT_TITLE = "CampusCircle — Your Campus Marketplace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: DEFAULT_TITLE };

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "buyer_id, buyer:profiles!conversations_buyer_id_fkey(full_name), seller:profiles!conversations_seller_id_fkey(full_name)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!conversation) return { title: DEFAULT_TITLE };

  const otherPerson = conversation.buyer_id === user.id ? conversation.seller : conversation.buyer;
  return {
    title: otherPerson?.full_name ? `${otherPerson.full_name} — CampusCircle` : DEFAULT_TITLE,
  };
}

export default async function ChatDetailPage({
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

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, listing:listings(id, title, price, images, condition, status), buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url)"
    )
    .eq("id", id)
    .single();

  if (!conversation) notFound();
  if (conversation.buyer?.id !== user.id && conversation.seller?.id !== user.id) {
    notFound();
  }

  const otherPerson =
    conversation.buyer?.id === user.id ? conversation.seller : conversation.buyer;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  await markConversationRead(id);

  return (
    <div className="mx-auto flex h-[calc(100vh-178px)] max-w-4xl flex-col px-4 py-4 sm:h-[calc(100vh-64px)]">
      <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Avatar avatarUrl={otherPerson?.avatar_url} name={otherPerson?.full_name ?? "S"} size={40} className="mt-0.5" />
          <div>
            <Link href="/chat" className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              ← All chats
            </Link>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {otherPerson?.full_name ?? "Student"}
            </h1>
          </div>
        </div>
        {otherPerson?.id && <SafetyMenu userId={otherPerson.id} />}
      </div>

      <ChatThread
        conversationId={id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
        listing={conversation.listing}
      />
    </div>
  );
}
