"use client";

import { useActionState } from "react";
import { updatePassword, type AuthResult } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import AuthLayout from "@/components/AuthLayout";

const initialState: AuthResult = { error: null };

const STEPS = [
  { title: "Sign up with your college email", description: "We verify you belong to your campus." },
  { title: "Land in your college's own marketplace", description: "Isolated from every other campus." },
  { title: "Buy, sell, chat", description: "All in person, all on campus." },
];

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <AuthLayout steps={STEPS}>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Choose a new password</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Pick something you haven&rsquo;t used here before.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-all duration-200 hover:border-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-all duration-200 hover:border-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {state.error}
          </p>
        )}

        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
