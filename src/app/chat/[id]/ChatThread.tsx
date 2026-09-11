"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/chat";
import { toast } from "@/lib/toast";
import { conditionBadgeClasses, conditionLabel } from "@/lib/conditionBadge";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
};

type ListingSummary = {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string | null;
  status: string;
} | null;

export default function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
  listing,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  listing?: ListingSummary;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let typingChannel: ReturnType<typeof supabase.channel> | null = null;
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

      channelRef.current = channel;

      // Separate private channel for the typing indicator — broadcast
      // channels aren't gated by table RLS like postgres_changes is, so
      // this needs its own Realtime Authorization policy (on
      // realtime.messages, scoped by conversation participation) plus
      // { private: true } here, or anyone who obtains a conversation id
      // could join and see/forge typing events for a chat they're not in.
      typingChannel = supabase
        .channel(`typing:${conversationId}`, { config: { private: true } })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.userId === currentUserId) return;
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        })
        .subscribe();

      typingChannelRef.current = typingChannel;
    })();

    return () => {
      cancelled = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channel) supabase.removeChannel(channel);
      if (typingChannel) supabase.removeChannel(typingChannel);
      channelRef.current = null;
      typingChannelRef.current = null;
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
      typingChannelRef.current?.send({
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
    // The bordered "card" wrapping the whole thread cost 32px of horizontal
    // chrome (page padding plus the card's own p-4) on top of the page's own
    // inset, and 32px of dead vertical padding above the first bubble and
    // below the input. Phones now go edge-to-edge like a real chat app — the
    // page's own px-3 is the only inset — with the card look kept from sm up.
    <div className="mt-3 flex flex-1 flex-col overflow-hidden sm:mt-4 sm:rounded-2xl sm:border sm:border-slate-300 sm:bg-white/70 sm:p-4 sm:shadow-sm sm:backdrop-blur-sm dark:sm:border-slate-800/70 dark:sm:bg-slate-900/60">
      <div className="flex-1 space-y-2 overflow-y-auto pb-2">
        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="mb-3 flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.08)] transition hover:border-brand/40 hover:shadow-[0_2px_8px_rgba(15,23,42,0.12)] dark:border-slate-800/70 dark:bg-slate-800/40 dark:shadow-sm"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {listing.images?.[0] ? (
                <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-slate-400 dark:text-slate-600">
                  No photo
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {listing.title}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-sm font-bold text-brand">
                  {Number(listing.price) > 0
                    ? `₹${Number(listing.price).toLocaleString("en-IN")}`
                    : "Free"}
                </span>
                {listing.condition && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${conditionBadgeClasses(listing.condition)}`}
                  >
                    {conditionLabel(listing.condition)}
                  </span>
                )}
                {listing.status !== "available" && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {listing.status}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}
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
                className={`max-w-[min(75%,42rem)] rounded-2xl px-4 py-2 text-sm shadow-sm ${
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
        {/* Icon-only on phones — a text "Send" button was permanently
            claiming ~50px of width from the typing area on the narrowest
            screens. sm+ keeps the labelled pill, matching every other page. */}
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md disabled:pointer-events-none disabled:opacity-50 sm:h-auto sm:w-auto sm:px-5 sm:py-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 sm:hidden" fill="currentColor">
            <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
          </svg>
          <span className="hidden text-sm font-semibold sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
