"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    createClient()
      .rpc("increment_listing_view", { p_listing_id: listingId })
      .then(() => {});
  }, [listingId]);

  return null;
}
