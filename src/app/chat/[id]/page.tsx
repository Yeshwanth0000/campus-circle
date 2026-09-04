import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markConversationRead } from "@/app/actions/chat";
import ChatThread from "./ChatThread";
import SafetyMenu from "@/components/SafetyMenu";

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
      "id, listing:listings(id, title), buyer:profiles!conversations_buyer_id_fkey(id, full_name), seller:profiles!conversations_seller_id_fkey(id, full_name)"
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
    .select("id, content, sender_id, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  await markConversationRead(id);

  return (
    <div className="mx-auto flex h-[calc(100vh-128px)] max-w-2xl flex-col px-4 py-4 sm:h-[calc(100vh-64px)]">
      <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <Link href="/chat" className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            ← All chats
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {otherPerson?.full_name ?? "Student"}
          </h1>
          {conversation.listing?.title && (
            <Link
              href={`/listings/${conversation.listing.id}`}
              className="text-xs text-brand hover:underline"
            >
              {conversation.listing.title}
            </Link>
          )}
        </div>
        {otherPerson?.id && <SafetyMenu userId={otherPerson.id} />}
      </div>

      <ChatThread
        conversationId={id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
