"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/chat";
import { toast } from "@/lib/toast";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
};

export default function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      // Realtime's own websocket needs the user's JWT explicitly set before
      // subscribing, otherwise RLS treats it as anonymous and silently
      // drops every event — session cookies alone aren't enough here.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) =>
              prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const updated = payload.new as Message;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, read_at: updated.read_at } : m))
            );
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const content = draft;
    setDraft("");
    const result = await sendMessage(conversationId, content);
    if (result.error) {
      toast(result.error, "error");
      setDraft(content);
    }
    setSending(false);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.map((m, i) => {
          const isMine = m.sender_id === currentUserId;
          const isLastMine = isMine && !messages.slice(i + 1).some((later) => later.sender_id === currentUserId);
          return (
            <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                {m.content}
              </div>
              {isLastMine && (
                <span className="mt-0.5 mr-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {m.read_at ? "Seen" : "Sent"}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
