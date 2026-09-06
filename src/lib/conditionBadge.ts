const CONDITION_STYLES: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "like-new": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  good: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  fair: "bg-slate-200 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400",
};

const FALLBACK_STYLE = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

export function conditionBadgeClasses(condition: string): string {
  return CONDITION_STYLES[condition] ?? FALLBACK_STYLE;
}

export function conditionLabel(condition: string): string {
  return condition.replace("-", " ");
}
