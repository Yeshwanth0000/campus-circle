"use client";

import { useTransition } from "react";
import { relistListing } from "@/app/actions/listings";
import { toast } from "@/lib/toast";

export default function RelistButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await relistListing(listingId);
      // relistListing redirects on success, so we only ever get here on error
      if (result?.error) {
        toast(result.error, "error");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:opacity-60"
    >
      {isPending ? "Relisting…" : "Relist this item"}
    </button>
  );
}
