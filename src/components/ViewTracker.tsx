"use client";

import { useEffect } from "react";
import { recordViewed } from "@/lib/recentlyViewed";

export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    recordViewed(listingId);
  }, [listingId]);

  return null;
}
