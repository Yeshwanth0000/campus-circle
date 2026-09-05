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
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

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
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.userId === currentUserId) return;
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        })
        .subscribe();

      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleDraftChange(value: string) {
    setDraft(value);
    const now = Date.now();
    if (value.trim() && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId },
      });
    }
  }

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
    <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.map((m, i) => {
          const isMine = m.sender_id === currentUserId;
          const isLastMine = isMine && !messages.slice(i + 1).some((later) => later.sender_id === currentUserId);
          return (
            <div
              key={m.id}
              className={`flex animate-message-in flex-col motion-reduce:animate-none ${isMine ? "items-end" : "items-start"}`}
              style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  isMine
                    ? "bg-gradient-to-br from-brand to-brand-dark text-white"
                    : "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
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
        {otherTyping && (
          <div className="flex animate-message-in items-start motion-reduce:animate-none">
            <div className="flex items-center gap-1 rounded-2xl bg-white px-3.5 py-3 text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
              <span className="typing-dot motion-reduce:animate-none" />
              <span className="typing-dot motion-reduce:animate-none [animation-delay:0.15s]" />
              <span className="typing-dot motion-reduce:animate-none [animation-delay:0.3s]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800/70">
        <input
          type="text"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          maxLength={2000}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
