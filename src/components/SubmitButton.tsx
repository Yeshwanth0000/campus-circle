"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
