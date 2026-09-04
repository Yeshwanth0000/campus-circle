"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/toast";

type ToastItem = { id: number; message: string; type: ToastType };

let counter = 0;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`animate-toast-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            t.type === "error"
              ? "bg-red-600"
              : t.type === "info"
                ? "bg-slate-900 dark:bg-slate-700"
                : "bg-emerald-600"
          }`}
        >
          {t.type === "success" && <span aria-hidden>✓</span>}
          {t.type === "error" && <span aria-hidden>✕</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}
