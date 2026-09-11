import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — Admin — CampusBin" };

// Always fetch fresh — a dashboard showing yesterday's numbers is worse than
// no dashboard.
export const dynamic = "force-dynamic";

type DayPoint = { day: string; count: number };
type CategoryPoint = { name: string; listings: number };
type TopListing = { id: string; title: string; view_count: number; status: string };

type Stats = {
  users_total: number;
  users_24h: number;
  users_7d: number;
  listings_total: number;
  listings_available: number;
  listings_sold: number;
  listings_expired: number;
  listings_24h: number;
  listings_7d: number;
  listings_with_photo: number;
  total_views: number;
  median_price: number;
  conversations_total: number;
  messages_total: number;
  messages_24h: number;
  saves_total: number;
  reports_open: number;
  sellers: number;
  messagers: number;
  by_category: CategoryPoint[];
  signups_by_day: DayPoint[];
  listings_by_day: DayPoint[];
  top_listings: TopListing[];
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // Same "don't distinguish forbidden from nonexistent" rule the reports page
  // uses — a non-admin gets an ordinary 404.
  if (!profile?.is_admin) notFound();

  // Counts come from a SECURITY DEFINER function rather than direct queries:
  // messages and conversations are RLS-scoped to their participants, so an
  // admin reading them directly would only ever count their own threads. The
  // function returns aggregates only and re-checks is_admin itself.
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  const stats = data as Stats | null;

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <div className="mt-6 rounded-xl border border-dashed border-rose-300 bg-rose-50/60 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          Couldn&rsquo;t load stats{error?.message ? `: ${error.message}` : "."}
        </div>
      </div>
    );
  }

  const activationListed = pct(stats.sellers, stats.users_total);
  const activationMessaged = pct(stats.messagers, stats.users_total);

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Everything happening in your college, live.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            stats.reports_open > 0
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {stats.reports_open > 0 ? `${stats.reports_open} open report${stats.reports_open === 1 ? "" : "s"}` : "Reports"}
        </Link>
      </div>

      {/* Headline numbers are just numbers — a chart here would add ink
          without adding information. */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Students" value={stats.users_total} delta={stats.users_24h} deltaLabel="today" />
        <StatTile label="Listings" value={stats.listings_total} delta={stats.listings_24h} deltaLabel="today" />
        <StatTile label="Conversations" value={stats.conversations_total} />
        <StatTile label="Messages" value={stats.messages_total} delta={stats.messages_24h} deltaLabel="today" />
      </div>

      <Section title="Activation" hint="Signing up is not using it — these are the numbers that matter early.">
        <div className="space-y-4">
          <FunnelRow label="Signed up" value={stats.users_total} total={stats.users_total} caption="100%" />
          <FunnelRow
            label="Listed something"
            value={stats.sellers}
            total={stats.users_total}
            caption={`${activationListed}% of students`}
          />
          <FunnelRow
            label="Sent a message"
            value={stats.messagers}
            total={stats.users_total}
            caption={`${activationMessaged}% of students`}
          />
        </div>
      </Section>

      {/* Two single-series charts side by side rather than one chart with two
          y-scales — different units never share an axis. */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <DayChart title="Signups" subtitle="Last 14 days" points={stats.signups_by_day} />
        <DayChart title="New listings" subtitle="Last 14 days" points={stats.listings_by_day} />
      </div>

      <Section title="Listings">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              By status
            </p>
            <div className="space-y-2">
              <StatusRow label="Available" value={stats.listings_available} total={stats.listings_total} tone="good" />
              <StatusRow label="Sold" value={stats.listings_sold} total={stats.listings_total} tone="neutral" />
              <StatusRow label="Expired" value={stats.listings_expired} total={stats.listings_total} tone="warn" />
            </div>
            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <MiniStat label="Total views" value={stats.total_views.toLocaleString("en-IN")} />
              <MiniStat label="Median price" value={`₹${Math.round(stats.median_price).toLocaleString("en-IN")}`} />
              <MiniStat
                label="With a photo"
                value={`${stats.listings_with_photo} of ${stats.listings_total}`}
              />
              <MiniStat label="Saves" value={stats.saves_total.toLocaleString("en-IN")} />
            </dl>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              By category
            </p>
            {stats.by_category.length > 0 ? (
              <div className="space-y-1.5">
                {stats.by_category.map((c) => (
                  <HBar
                    key={c.name}
                    label={c.name}
                    value={c.listings}
                    max={Math.max(...stats.by_category.map((x) => x.listings))}
                  />
                ))}
              </div>
            ) : (
              <Empty>No listings yet.</Empty>
            )}
          </div>
        </div>
      </Section>

      <Section title="Most viewed">
        {stats.top_listings.length > 0 ? (
          <ol className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.top_listings.map((l, i) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400 dark:text-slate-500">
                  {i + 1}
                </span>
                <Link
                  href={`/listings/${l.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-slate-800 hover:text-brand dark:text-slate-200"
                >
                  {l.title}
                </Link>
                {l.status !== "available" && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {l.status}
                  </span>
                )}
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {l.view_count}
                </span>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">views</span>
              </li>
            ))}
          </ol>
        ) : (
          <Empty>No views recorded yet.</Empty>
        )}
      </Section>
    </div>
  );
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {hint && <p className="mt-0.5 mb-4 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  delta,
  deltaLabel,
}: {
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
        {value.toLocaleString("en-IN")}
      </p>
      {delta !== undefined && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {delta > 0 ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{delta}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">0</span>
          )}{" "}
          {deltaLabel}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  total,
  caption,
}: {
  label: string;
  value: number;
  total: number;
  caption: string;
}) {
  const width = total ? Math.max((value / total) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {value} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">· {caption}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  good: "bg-emerald-500",
  neutral: "bg-slate-400 dark:bg-slate-500",
  warn: "bg-amber-500",
};

function StatusRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: keyof typeof STATUS_TONE | string;
}) {
  const width = total ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {/* The swatch is decorative — the label and number carry the meaning, so
          this still reads correctly in greyscale or with colour blindness. */}
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${STATUS_TONE[tone]}`} />
      <span className="w-20 shrink-0 text-xs text-slate-600 dark:text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${STATUS_TONE[tone]}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? Math.max((value / max) * 100, 4) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-slate-600 dark:text-slate-400" title={label}>
        {label}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded bg-brand/80" style={{ width: `${width}%` }} />
      </div>
      <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

function DayChart({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: DayPoint[];
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{total}</p>
      </div>

      <div className="mt-4 flex h-24 items-end gap-1">
        {points.map((p) => {
          const height = (p.count / max) * 100;
          const label = new Date(`${p.day}T00:00:00`).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });
          return (
            <div
              key={p.day}
              className="group relative flex flex-1 flex-col justify-end"
              title={`${label}: ${p.count}`}
            >
              <div
                className={`w-full rounded-t ${p.count > 0 ? "bg-brand" : "bg-slate-200 dark:bg-slate-800"}`}
                style={{ height: p.count > 0 ? `${Math.max(height, 6)}%` : "2px" }}
              />
            </div>
          );
        })}
      </div>
      {/* Only the ends are labelled — a date under all fourteen bars would be
          unreadable at this width and adds nothing. */}
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>{formatDay(points[0]?.day)}</span>
        <span>{formatDay(points[points.length - 1]?.day)}</span>
      </div>
    </section>
  );
}

function formatDay(day: string | undefined) {
  if (!day) return "";
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {children}
    </p>
  );
}
