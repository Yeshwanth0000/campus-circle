"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Students share computers in hostels, labs, and the library — someone who
// walks away without logging out shouldn't leave their account open
// indefinitely. 30 minutes balances that risk against not logging people
// out mid-browse over a normal reading pause.
const IDLE_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

export default function InactivityLogout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSessionRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    function clearTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    function scheduleLogout() {
      clearTimer();
      if (!hasSessionRef.current) return;
      timeoutRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login?reason=inactivity");
      }, IDLE_LIMIT_MS);
    }

    function handleActivity() {
      if (hasSessionRef.current) scheduleLogout();
    }

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      hasSessionRef.current = !!session;
      if (hasSessionRef.current) scheduleLogout();
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      hasSessionRef.current = !!session;
      if (hasSessionRef.current) {
        scheduleLogout();
      } else {
        clearTimer();
      }
    });

    ACTIVITY_EVENTS.forEach((evt) => document.addEventListener(evt, handleActivity));

    return () => {
      clearTimer();
      subscription.unsubscribe();
      ACTIVITY_EVENTS.forEach((evt) => document.removeEventListener(evt, handleActivity));
    };
  }, [router]);

  return null;
}
