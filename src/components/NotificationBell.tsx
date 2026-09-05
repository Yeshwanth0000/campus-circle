"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";
import { describeNotification, timeAgo, type NotificationLike } from "@/lib/notificationDisplay";

export default function NotificationBell({
  unreadCount,
  recentNotifications,
}: {
  unreadCount: number;
  recentNotifications: NotificationLike[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(recentNotifications);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleItemClick(n: NotificationLike) {
    if (!n.read_at) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setLocalUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id);
    }
    setOpen(false);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setLocalUnreadCount(0);
    markAllNotificationsRead();
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={localUnreadCount > 0 ? `Notifications, ${localUnreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {localUnreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {localUnreadCount > 9 ? "9+" : localUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-notif-panel-in overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-xl motion-reduce:animate-none dark:border-slate-800/70 dark:bg-slate-900/90"
          >
            <div className="flex items-center justify-between border-b border-slate-100/70 px-4 py-3 dark:border-slate-800/70">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
              {localUnreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-brand hover:text-brand-dark"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n, i) => {
                  const { href, title, subtitle } = describeNotification(n);
                  const isUnread = !n.read_at;
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => handleItemClick(n)}
                      className="flex animate-message-in items-start gap-3 px-4 py-3 transition-colors motion-reduce:animate-none hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          isUnread ? "bg-rose-500" : "bg-transparent"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${
                            isUnread
                              ? "font-semibold text-slate-900 dark:text-slate-100"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {title}
                        </p>
                        {subtitle && (
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                        )}
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
                        {timeAgo(n.created_at)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100/70 px-4 py-2.5 text-center text-sm font-medium text-brand transition-colors hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-800/60"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
