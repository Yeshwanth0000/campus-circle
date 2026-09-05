import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import ThemeToggle from "./ThemeToggle";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import FloatingHeaderShell from "./FloatingHeaderShell";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let collegeName: string | null = null;
  let hasUnread = false;
  let unreadNotificationCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("colleges(name)")
      .eq("id", user.id)
      .single();
    collegeName = profile?.colleges?.name ?? null;

    const { count } = await supabase
      .from("messages")
      .select("id, conversations!inner(buyer_id, seller_id)", {
        count: "exact",
        head: true,
      })
      .is("read_at", null)
      .neq("sender_id", user.id)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`, {
        foreignTable: "conversations",
      });
    hasUnread = (count ?? 0) > 0;

    const { count: notifCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    unreadNotificationCount = notifCount ?? 0;
  }

  return (
    <>
      <FloatingHeaderShell>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-baseline gap-2">
            <span className="text-xl font-bold text-brand">CampusCircle</span>
            {collegeName && (
              <span className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 md:inline">
                {collegeName}
              </span>
            )}
          </Link>

          {user && (
            <div className="hidden flex-1 sm:block">
              <HeaderSearch />
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            {user && <NotificationBell unreadCount={unreadNotificationCount} />}
            <ThemeToggle />
            <HeaderNav isLoggedIn={!!user} hasUnread={hasUnread} />
          </div>
        </div>

        {user && (
          <div className="border-t border-slate-100/70 px-4 py-2 dark:border-slate-800/70 sm:hidden">
            <HeaderSearch />
          </div>
        )}
      </FloatingHeaderShell>

      {user && <BottomNav hasUnread={hasUnread} />}
    </>
  );
}
