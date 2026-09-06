export const metadata = { title: "Terms & Conditions — CampusCircle" };

const SECTIONS = [
  {
    title: "What CampusCircle is",
    body: "CampusCircle is a peer-to-peer classifieds platform that connects students on the same campus to buy and sell items directly with each other. We are an independent student project — not affiliated with, endorsed by, or operated on behalf of any college or university.",
  },
  {
    title: "Cash, in-person transactions only",
    body: "All trades happen directly between students, in person, for cash or any arrangement they agree on. CampusCircle never processes payments, holds funds, or takes a cut of any sale — we're simply the listing and messaging layer.",
  },
  {
    title: "Your account",
    body: "Access requires a valid college email address. You're responsible for what you post and for keeping your account secure. Don't impersonate someone else or share your login with others.",
  },
  {
    title: "Prohibited items and conduct",
    body: (
      <>
        No illegal items, weapons, drugs, counterfeit goods, or anything your
        college&rsquo;s code of conduct prohibits. No harassment, scams, or
        misleading listings. See our{" "}
        <a href="/safety" className="font-semibold text-brand hover:text-brand-dark">
          Community Guidelines
        </a>{" "}
        for details. We may remove listings or suspend accounts that violate
        these rules.
      </>
    ),
  },
  {
    title: "No warranty",
    body: "Items are sold as-is between students. CampusCircle doesn't inspect, verify, or guarantee the condition, authenticity, or legality of anything listed. Use your judgment, meet in safe public places, and inspect items before paying.",
  },
  {
    title: "Changes",
    body: "This is a small, evolving student project, so these terms may change as the platform grows. Continued use after a change means you accept the update.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Terms &amp; Conditions
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Last updated {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
      </p>

      <ol className="mt-8 divide-y divide-slate-200/70 dark:divide-slate-800/70">
        {SECTIONS.map((section, i) => (
          <li key={section.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <span
              aria-hidden
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {section.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
