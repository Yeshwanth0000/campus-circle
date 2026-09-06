import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportActions from "./ReportActions";

export const metadata = { title: "Reports — Admin — CampusCircle" };

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  dismissed: "bg-slate-200 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400",
};

export default async function AdminReportsPage() {
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

  // Same "don't distinguish forbidden from nonexistent" pattern used
  // elsewhere in the app (e.g. a chat you're not part of) — a non-admin
  // hitting this URL sees an ordinary 404, not a "you're not allowed" page
  // that confirms the route exists.
  if (!profile?.is_admin) notFound();

  // RLS ("admins can view reports in their college") already scopes this
  // to the admin's own college — this query would return the same rows
  // even without the explicit .order below narrowing anything further.
  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reason, details, status, created_at, resolved_at, reported_listing_id, reported_user_id, reporter:profiles!reports_reporter_id_fkey(full_name), reported_user:profiles!reports_reported_user_id_fkey(full_name), reported_listing:listings(id, title)"
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  const openReports = reports?.filter((r) => r.status === "open") ?? [];
  const closedReports = reports?.filter((r) => r.status !== "open") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {openReports.length} open report{openReports.length === 1 ? "" : "s"} in your college.
      </p>

      {reports && reports.length > 0 ? (
        <div className="mt-6 space-y-3">
          {[...openReports, ...closedReports].map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.reason}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Reported by {r.reporter?.full_name ?? "a student"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Against{" "}
                    {r.reported_listing ? (
                      <Link href={`/listings/${r.reported_listing.id}`} className="font-medium text-brand hover:underline">
                        {r.reported_listing.title}
                      </Link>
                    ) : r.reported_user_id ? (
                      <Link href={`/sellers/${r.reported_user_id}`} className="font-medium text-brand hover:underline">
                        {r.reported_user?.full_name ?? "a student"}
                      </Link>
                    ) : (
                      "deleted content"
                    )}
                  </p>
                  {r.details && (
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.details}</p>
                  )}
                </div>
                {r.status === "open" && <ReportActions reportId={r.id} />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No reports filed yet.
        </div>
      )}
    </div>
  );
}
