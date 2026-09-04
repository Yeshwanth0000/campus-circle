import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, created_at, listing:listings(id, title, images), buyer:profiles!conversations_buyer_id_fkey(id, full_name), seller:profiles!conversations_seller_id_fkey(id, full_name)"
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const { data: unreadRows } = await supabase
    .from("messages")
    .select("conversation_id")
    .is("read_at", null)
    .neq("sender_id", user.id);
  const unreadConversationIds = new Set(unreadRows?.map((r) => r.conversation_id));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your chats</h1>

      {conversations && conversations.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {conversations.map((c) => {
            const otherPerson = c.buyer?.id === user.id ? c.seller : c.buyer;
            const isUnread = unreadConversationIds.has(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        isUnread
                          ? "font-bold text-slate-900 dark:text-slate-100"
                          : "font-semibold text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {otherPerson?.full_name ?? "Student"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {c.listing?.title}
                    </p>
                  </div>
                  {isUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No conversations yet. Message a seller from any listing to start one.
        </div>
      )}
    </div>
  );
}
