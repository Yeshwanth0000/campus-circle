import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import SavedSearchRow from "./SavedSearchRow";

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: searches } = await supabase
    .from("saved_searches")
    .select(
      "id, query, condition, posted, category_id, last_viewed_at, created_at, categories(name, slug)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const withCounts = await Promise.all(
    (searches ?? []).map(async (s) => {
      let countQuery = supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "available")
        .gt("created_at", s.last_viewed_at);
      if (s.category_id) countQuery = countQuery.eq("category_id", s.category_id);
      if (s.query) countQuery = countQuery.ilike("title", `%${s.query}%`);
      if (s.condition) countQuery = countQuery.eq("condition", s.condition);
      const { count } = await countQuery;
      return { ...s, newCount: count ?? 0 };
    })
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Saved searches</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Revisit a search and see how many new listings match since you last checked.
      </p>

      {withCounts.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {withCounts.map((s) => (
            <SavedSearchRow key={s.id} search={s} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z"
              />
            </svg>
          }
          title="No saved searches yet"
          description="Search or filter on Browse, then tap Save this search to get notified of new matches."
          actionHref="/browse"
          actionLabel="Browse listings"
        />
      )}
    </div>
  );
}
