export default function AuthLayout({
  children,
  steps,
}: {
  children: React.ReactNode;
  steps: { title: string; description: string }[];
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        {/* Fixed light accent panel — deliberately doesn't follow dark mode,
            same way a brand hero panel stays put regardless of site theme. */}
        <div className="hidden flex-col justify-center bg-indigo-50 p-10 sm:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-2xl">
            🎓
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900">CampusCircle</h2>
          <p className="mt-2 text-sm text-slate-700">
            The private marketplace for your own campus — buy, sell, and trade
            with people you can actually trust.
          </p>
          <ul className="mt-8 space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
