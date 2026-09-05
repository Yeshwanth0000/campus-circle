"use client";

import Link from "next/link";
import { markNotificationRead } from "@/app/actions/notifications";

type Notification = {
  id: string;
  type: string;
  payload: unknown;
  read_at: string | null;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationRow({ notification }: { notification: Notification }) {
  const isUnread = !notification.read_at;
  const payload = (notification.payload ?? {}) as Record<string, string>;

  if (notification.type === "new_message") {
    return (
      <li>
        <Link
          href={`/chat/${payload.conversation_id}`}
          onClick={() => {
            if (isUnread) markNotificationRead(notification.id);
          }}
          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
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
              {payload.sender_name ?? "A student"} sent you a message
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {payload.preview}
            </p>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
            {timeAgo(notification.created_at)}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
      New notification
    </li>
  );
}
