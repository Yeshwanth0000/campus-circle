import Link from "next/link";

export const metadata = { title: "Safety & Community Guidelines — CampusBin" };

const SECTIONS = [
  {
    icon: "🤝",
    title: "Meeting up",
    body: (
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>
          Meet in busy, public campus spots — libraries, mess halls, main
          gates — not isolated areas or dorm rooms of people you don&rsquo;t
          know.
        </li>
        <li>Bring a friend if you can, especially for higher-value items.</li>
        <li>Inspect the item in person before paying anything.</li>
        <li>Trust your gut — if something feels off, it&rsquo;s fine to walk away.</li>
      </ul>
    ),
  },
  {
    icon: "💸",
    title: "Payments",
    body: (
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>Cash or UPI in person is safest. Never send money before seeing the item.</li>
        <li>
          CampusBin never asks for payment through the app — anyone
          claiming to be &ldquo;CampusBin support&rdquo; asking for money
          is a scam.
        </li>
        <li>Never share OTPs, bank passwords, or card details with a buyer or seller.</li>
      </ul>
    ),
  },
  {
    icon: "🚫",
    title: "Prohibited items",
    body: (
      <p className="mt-2">
        Don&rsquo;t list weapons, drugs, alcohol, counterfeit goods, stolen
        property, or anything illegal or against your college&rsquo;s code of
        conduct. Listings like these will be removed and may be reported.
      </p>
    ),
  },
  {
    icon: "🚩",
    title: "Reporting a problem",
    body: (
      <p className="mt-2">
        Every listing and seller profile has a ⋮ menu with Report and Block
        options. Report for scams, harassment, or prohibited items — reports
        are reviewed directly. Block to stop seeing someone&rsquo;s listings
        and prevent them from messaging you; manage everyone you&rsquo;ve
        blocked anytime from{" "}
        <Link href="/profile" className="font-semibold text-brand hover:text-brand-dark">
          your profile
        </Link>
        .
      </p>
    ),
  },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Safety Tips &amp; Community Guidelines
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        CampusBin keeps trades within your own verified college community,
        but no platform can guarantee safety on its own. A few ground rules:
      </p>

      <div className="mt-6 space-y-4">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-800/40"
          >
            <h2 className="flex items-center gap-2.5 font-semibold text-slate-900 dark:text-slate-100">
              <span aria-hidden className="text-lg">
                {section.icon}
              </span>
              {section.title}
            </h2>
            <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
