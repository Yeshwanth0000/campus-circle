import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import EmptyState from "@/components/EmptyState";
import NotificationRow from "./NotificationRow";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = notifications?.some((n) => !n.read_at) ?? false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications && notifications.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          }
          title="No notifications yet"
          description="You'll see new messages and updates about your listings here."
          actionHref="/browse"
          actionLabel="Browse listings"
        />
      )}
    </div>
  );
}

function MarkAllReadButton() {
  return (
    <form action={markAllNotificationsRead}>
      <button
        type="submit"
        className="text-sm font-medium text-brand hover:text-brand-dark"
      >
        Mark all as read
      </button>
    </form>
  );
}
