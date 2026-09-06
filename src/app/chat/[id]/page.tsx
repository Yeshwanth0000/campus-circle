import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { markConversationRead } from "@/app/actions/chat";
import ChatThread from "./ChatThread";
import SafetyMenu from "@/components/SafetyMenu";
import Avatar from "@/components/Avatar";
import { conditionBadgeClasses, conditionLabel } from "@/lib/conditionBadge";

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
    <div className="mx-auto flex h-[calc(100vh-178px)] max-w-2xl flex-col px-4 py-4 sm:h-[calc(100vh-64px)]">
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

      {conversation.listing && (
        <Link
          href={`/listings/${conversation.listing.id}`}
          className="mt-3 flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-2.5 shadow-sm backdrop-blur-sm transition hover:border-brand/30 dark:border-slate-800/70 dark:bg-slate-900/60"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {conversation.listing.images?.[0] ? (
              <Image
                src={conversation.listing.images[0]}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-slate-400 dark:text-slate-600">
                No photo
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {conversation.listing.title}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-sm font-bold text-brand">
                {Number(conversation.listing.price) > 0
                  ? `₹${Number(conversation.listing.price).toLocaleString("en-IN")}`
                  : "Free"}
              </span>
              {conversation.listing.condition && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${conditionBadgeClasses(conversation.listing.condition)}`}
                >
                  {conditionLabel(conversation.listing.condition)}
                </span>
              )}
              {conversation.listing.status !== "available" && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {conversation.listing.status}
                </span>
              )}
            </div>
          </div>
        </Link>
      )}

      <ChatThread
        conversationId={id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
