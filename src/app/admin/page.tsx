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
type NamedCount = { name: string; n: number };
type Seller = { name: string; listings: number; views: number };
type HourPoint = { hour: number; n: number };
type PriceBucket = { label: string; sort: number; n: number };

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
  listings_no_desc: number;
  total_views: number;
  median_price: number;
  listings_zero_views: number;
  listings_no_convo: number;
  listings_stale_30d: number;
  sell_through_pct: number;
  median_days_to_sell: number;
  sold_with_timing: number;
  total_images: number;
  conversations_total: number;
  messages_total: number;
  messages_24h: number;
  convos_unanswered: number;
  convos_one_message: number;
  median_reply_mins: number;
  active_24h: number;
  active_7d: number;
  never_returned: number;
  saves_total: number;
  reports_open: number;
  sellers: number;
  messagers: number;
  by_category: CategoryPoint[];
  empty_categories: string[];
  book_departments: NamedCount[];
  top_sellers: Seller[];
  activity_by_hour: HourPoint[];
  price_buckets: PriceBucket[];
  signups_by_day: DayPoint[];
  listings_by_day: DayPoint[];
  top_listings: TopListing[];
  generated_at: string;
};

// 1 GB of Supabase storage is the ceiling on the free plan, and photos are
// what fills it. Listing photos compress to roughly 300 KB at 1600px/q0.82.
const EST_KB_PER_IMAGE = 300;
const STORAGE_LIMIT_MB = 1024;

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
  const msgsPerConvo =
    stats.conversations_total > 0
      ? (stats.messages_total / stats.conversations_total).toFixed(1)
      : "—";

  const storageMb = (stats.total_images * EST_KB_PER_IMAGE) / 1024;
  const storagePct = Math.min(100, (storageMb / STORAGE_LIMIT_MB) * 100);

  // Only surface a row when there is genuinely something to do about it.
  const alerts = [
    stats.convos_unanswered > 0 && {
      label: "Conversations a seller never replied to",
      value: stats.convos_unanswered,
      why: "A buyer who gets silence doesn't come back. Fastest way to lose early trust.",
    },
    stats.reports_open > 0 && {
      label: "Open reports",
      value: stats.reports_open,
      why: "Waiting on moderation.",
    },
    stats.listings_zero_views > 0 && {
      label: "Live listings with no views at all",
      value: stats.listings_zero_views,
      why: "Nobody is reaching them — a discovery problem, not a supply one.",
    },
    stats.listings_stale_30d > 0 && {
      label: "Listings live for over 30 days",
      value: stats.listings_stale_30d,
      why: "Probably sold off-app or abandoned. Stale supply makes the whole grid look dead.",
    },
    stats.never_returned > 0 && {
      label: "Students who signed up and never returned",
      value: stats.never_returned,
      why: "Worth asking a few of them what they expected to find.",
    },
  ].filter(Boolean) as { label: string; value: number; why: string }[];

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Everything happening in your college · as of {stats.generated_at}
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

      {/* Things that need a decision, surfaced before the charts — a number
          you have to hunt for is a number you won't act on. */}
      {alerts.length > 0 && (
        <Section title="Needs attention">
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.label}
                className="flex items-start gap-3 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <span className="mt-0.5 text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {a.value}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Retention" hint="Coming back is the only real vote of confidence.">
        <div className="grid grid-cols-3 gap-3">
          <Compact label="Active today" value={stats.active_24h} sub={`of ${stats.users_total}`} />
          <Compact label="Active this week" value={stats.active_7d} sub={`of ${stats.users_total}`} />
          <Compact
            label="Never came back"
            value={stats.never_returned}
            sub="signed up, never returned"
            tone={stats.never_returned > 0 ? "warn" : "plain"}
          />
        </div>
      </Section>

      {/* Two single-series charts side by side rather than one chart with two
          y-scales — different units never share an axis. */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <DayChart title="Signups" subtitle="Last 14 days" points={stats.signups_by_day} />
        <DayChart title="New listings" subtitle="Last 14 days" points={stats.listings_by_day} />
      </div>

      <Section title="Marketplace health" hint="Is the market actually clearing, or just accumulating?">
        <div className="grid gap-6 sm:grid-cols-2">
          <dl className="space-y-2 text-sm">
            <MiniStat label="Sell-through" value={`${stats.sell_through_pct}%`} />
            <MiniStat
              label="Median time to sell"
              value={
                stats.sold_with_timing > 0
                  ? `${stats.median_days_to_sell} days`
                  : "not enough data yet"
              }
            />
            <MiniStat label="Messages per conversation" value={msgsPerConvo} />
            <MiniStat
              label="Median seller reply"
              value={stats.median_reply_mins > 0 ? formatMinutes(stats.median_reply_mins) : "—"}
            />
          </dl>
          <dl className="space-y-2 text-sm">
            <MiniStat label="Unanswered conversations" value={String(stats.convos_unanswered)} />
            <MiniStat label="Listings with no views" value={String(stats.listings_zero_views)} />
            <MiniStat label="Listings nobody messaged" value={String(stats.listings_no_convo)} />
            <MiniStat label="Live over 30 days" value={String(stats.listings_stale_30d)} />
          </dl>
        </div>
      </Section>

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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Price spread" subtitle="Where the campus actually trades">
          <div className="space-y-1.5">
            {stats.price_buckets.map((b) => (
              <HBar
                key={b.label}
                label={b.label}
                value={b.n}
                max={Math.max(1, ...stats.price_buckets.map((x) => x.n))}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Books by department" subtitle="Whether the new field is being used">
          {stats.book_departments.length > 0 ? (
            <div className="space-y-1.5">
              {stats.book_departments.map((d) => (
                <HBar
                  key={d.name}
                  label={d.name}
                  value={d.n}
                  max={Math.max(1, ...stats.book_departments.map((x) => x.n))}
                />
              ))}
            </div>
          ) : (
            <Empty>No book listings yet.</Empty>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Top sellers" subtitle="Who is carrying the supply side">
          {stats.top_sellers.length > 0 ? (
            <ol className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.top_sellers.map((s, i) => (
                <li key={`${s.name}-${i}`} className="flex items-center gap-3 py-2">
                  <span className="w-4 shrink-0 text-right text-xs tabular-nums text-slate-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                    {s.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {s.views} views
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {s.listings}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>No sellers yet.</Empty>
          )}
        </Panel>

        <Panel title="When the campus is online" subtitle="Message activity by hour (IST)">
          <HourChart points={stats.activity_by_hour} />
        </Panel>
      </div>

      <Section
        title="Capacity"
        hint="Supabase free plan gives 1 GB of file storage — photos are what fill it."
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            ~{storageMb.toFixed(0)} MB of {STORAGE_LIMIT_MB} MB
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stats.total_images} photos · estimated at {EST_KB_PER_IMAGE} KB each
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${storagePct > 80 ? "bg-rose-500" : storagePct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.max(storagePct, 1)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Sold listings keep their photos, so this only goes up. At this rate the cap lands around{" "}
          {stats.total_images > 0
            ? Math.round((STORAGE_LIMIT_MB * 1024) / EST_KB_PER_IMAGE).toLocaleString("en-IN")
            : "~3,500"}{" "}
          photos.
        </p>
      </Section>

      <Section title="Content quality" hint="Listings that are unlikely to sell as posted.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Compact label="With a photo" value={stats.listings_with_photo} sub={`of ${stats.listings_total}`} />
          <Compact
            label="No description"
            value={stats.listings_no_desc}
            sub="harder to trust"
            tone={stats.listings_no_desc > 0 ? "warn" : "plain"}
          />
          <Compact label="Saves" value={stats.saves_total} sub="total" />
          <Compact label="Empty categories" value={stats.empty_categories.length} sub="nothing to browse" />
        </div>
        {stats.empty_categories.length > 0 && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Nothing listed in: {stats.empty_categories.join(", ")}
          </p>
        )}
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

      {/* items-stretch, not items-end: each column has to be full height or
          the bar's percentage height resolves against a zero-height parent
          and every bar renders invisible. */}
      <div className="mt-4 flex h-24 items-stretch gap-1">
        {points.map((p) => {
          const height = (p.count / max) * 100;
          const label = new Date(`${p.day}T00:00:00`).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });
          return (
            <div
              key={p.day}
              className="group relative flex h-full flex-1 flex-col justify-end"
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

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      {children}
    </section>
  );
}

function Compact({
  label,
  value,
  sub,
  tone = "plain",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "plain" | "warn";
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-slate-800/70 dark:bg-slate-900/40">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-0.5 text-xl font-bold tabular-nums ${
          tone === "warn" && value > 0
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value.toLocaleString("en-IN")}
      </p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

function formatMinutes(mins: number) {
  if (mins < 60) return `${Math.round(mins)} min`;
  const hours = mins / 60;
  if (hours < 24) return `${hours.toFixed(1)} hr`;
  return `${(hours / 24).toFixed(1)} days`;
}

function HourChart({ points }: { points: HourPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.n));
  const busiest = points.reduce((a, b) => (b.n > a.n ? b : a), points[0]);
  return (
    <div>
      <div className="flex h-20 items-stretch gap-px">
        {points.map((p) => (
          <div
            key={p.hour}
            className="flex h-full flex-1 flex-col justify-end"
            title={`${formatHour(p.hour)} — ${p.n} message${p.n === 1 ? "" : "s"}`}
          >
            <div
              className={`w-full rounded-t-sm ${p.n > 0 ? "bg-brand" : "bg-slate-200 dark:bg-slate-800"}`}
              style={{ height: p.n > 0 ? `${Math.max((p.n / max) * 100, 8)}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>12 am</span>
        <span>12 pm</span>
        <span>11 pm</span>
      </div>
      {busiest && busiest.n > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Busiest around <span className="font-semibold">{formatHour(busiest.hour)}</span> — a good
          slot for announcements.
        </p>
      )}
    </div>
  );
}

function formatHour(hour: number) {
  const suffix = hour < 12 ? "am" : "pm";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {children}
    </p>
  );
}
