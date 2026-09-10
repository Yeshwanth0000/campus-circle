"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordReset, type PasswordResetResult } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import AuthLayout from "@/components/AuthLayout";

const initialState: PasswordResetResult = { error: null };

const STEPS = [
  { title: "Sign up with your college email", description: "We verify you belong to your campus." },
  { title: "Land in your college's own marketplace", description: "Isolated from every other campus." },
  { title: "Buy, sell, chat", description: "All in person, all on campus." },
];

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);
  const [email, setEmail] = useState("");

  if (state?.success) {
    return (
      <AuthLayout steps={STEPS}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Check your inbox</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          If an account exists for <span className="font-medium">{email}</span>, we&rsquo;ve sent a
          link to reset your password.
        </p>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Don&rsquo;t see it? Check your spam folder.
        </p>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Back to log in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout steps={STEPS}>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reset your password</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Enter your college email and we&rsquo;ll send you a link to reset it.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            College email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-all duration-200 hover:border-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
          />
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {state.error}
          </p>
        )}

        <SubmitButton>Send reset link</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
