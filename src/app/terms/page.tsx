export const metadata = { title: "Terms & Conditions — CampusCircle" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Terms &amp; Conditions
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Last updated {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
      </p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">1. What CampusCircle is</h2>
          <p className="mt-1">
            CampusCircle is a peer-to-peer classifieds platform that connects
            students on the same campus to buy and sell items directly with
            each other. We are an independent student project — not affiliated
            with, endorsed by, or operated on behalf of any college or
            university.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">2. Cash, in-person transactions only</h2>
          <p className="mt-1">
            All trades happen directly between students, in person, for cash
            or any arrangement they agree on. CampusCircle never processes
            payments, holds funds, or takes a cut of any sale — we&rsquo;re
            simply the listing and messaging layer.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">3. Your account</h2>
          <p className="mt-1">
            Access requires a valid college email address. You&rsquo;re
            responsible for what you post and for keeping your account secure.
            Don&rsquo;t impersonate someone else or share your login with
            others.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">4. Prohibited items and conduct</h2>
          <p className="mt-1">
            No illegal items, weapons, drugs, counterfeit goods, or anything
            your college&rsquo;s code of conduct prohibits. No harassment,
            scams, or misleading listings. See our{" "}
            <a href="/safety" className="font-semibold text-brand hover:text-brand-dark">
              Community Guidelines
            </a>{" "}
            for details. We may remove listings or suspend accounts that
            violate these rules.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">5. No warranty</h2>
          <p className="mt-1">
            Items are sold as-is between students. CampusCircle doesn&rsquo;t
            inspect, verify, or guarantee the condition, authenticity, or
            legality of anything listed. Use your judgment, meet in safe
            public places, and inspect items before paying.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">6. Changes</h2>
          <p className="mt-1">
            This is a small, evolving student project, so these terms may
            change as the platform grows. Continued use after a change means
            you accept the update.
          </p>
        </section>
      </div>
    </div>
  );
}
