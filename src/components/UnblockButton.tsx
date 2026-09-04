"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { unblockUser } from "@/app/actions/safety";
import { toast } from "@/lib/toast";

export default function UnblockButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await unblockUser(userId);
          toast("User unblocked.");
          router.refresh();
        })
      }
      className="text-xs font-semibold text-brand hover:text-brand-dark disabled:opacity-50"
    >
      Unblock
    </button>
  );
}
