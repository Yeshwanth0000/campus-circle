export type NotificationLike = {
  id: string;
  type: string;
  payload: unknown;
  read_at: string | null;
  created_at: string;
};

export function describeNotification(n: NotificationLike): {
  href: string;
  title: string;
  subtitle: string;
} {
  const payload = (n.payload ?? {}) as Record<string, string>;

  if (n.type === "new_message") {
    return {
      href: `/chat/${payload.conversation_id}`,
      title: `${payload.sender_name ?? "A student"} sent you a message`,
      subtitle: payload.preview ?? "",
    };
  }

  if (n.type === "listing_status") {
    const statusLabel = payload.status === "sold" ? "marked as sold" : "expired";
    return {
      href: `/listings/${payload.listing_id}`,
      title: `A listing you saved was ${statusLabel}`,
      subtitle: payload.title ?? "",
    };
  }

  return { href: "/notifications", title: "New notification", subtitle: "" };
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
