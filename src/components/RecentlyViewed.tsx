"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getViewedIds } from "@/lib/recentlyViewed";
import ListingCard from "./ListingCard";

type ViewedListing = {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  condition: string | null;
  created_at: string;
  seller_id: string;
  categories: { name: string } | null;
};

export default function RecentlyViewed({ excludeIds = [] }: { excludeIds?: string[] }) {
  const [listings, setListings] = useState<ViewedListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ids = getViewedIds();
    if (ids.length === 0) {
      setListings([]);
      return;
    }

    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data }, { data: blockedRows }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, price, images, status, condition, created_at, seller_id, categories(name)")
          .in("id", ids),
        user
          ? supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id)
          : Promise.resolve({ data: [] as { blocked_id: string }[] }),
      ]);

      if (cancelled) return;

      if (!data) {
        setListings([]);
        return;
      }
      const blockedIds = new Set(blockedRows?.map((r) => r.blocked_id));
      // Preserve most-recently-viewed-first order
      const byId = new Map(data.map((l) => [l.id, l]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter(
          (l): l is ViewedListing =>
            !!l && !excludeIds.includes(l.id) && !blockedIds.has(l.seller_id)
        );
      setListings(ordered);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!listings || listings.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Recently viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {listings.map((l) => (
          <div key={l.id} className="w-36 shrink-0 sm:w-44">
            <ListingCard
              id={l.id}
              title={l.title}
              price={Number(l.price)}
              images={l.images}
              status={l.status}
              condition={l.condition}
              createdAt={l.created_at}
              categoryName={l.categories?.name}
              hideSave
            />
          </div>
        ))}
      </div>
    </div>
  );
}
