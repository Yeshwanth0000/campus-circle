"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthResult } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/lib/toast";

const initialState: AuthResult = { error: null };

const STEPS = [
  { title: "Sign up with your college email", description: "We verify you belong to your campus." },
  { title: "Land in your college's own circle", description: "Isolated from every other campus." },
  { title: "Buy, sell, chat", description: "All in person, all on campus." },
];

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  // Controlled so a failed login (wrong password) doesn't also wipe the
  // email the user already typed — see the same fix on the signup form.
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (searchParams.get("reason") === "inactivity") {
      toast("You were logged out after a period of inactivity.", "info");
    }
    const error = searchParams.get("error");
    if (error) {
      toast(error, "error");
    }
  }, [searchParams]);

  return (
    <AuthLayout steps={STEPS}>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Log in with your college email to reach your campus marketplace.
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
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand hover:text-brand-dark">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-all duration-200 hover:border-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
          />
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {state.error}
          </p>
        )}

        <SubmitButton>Log in</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
