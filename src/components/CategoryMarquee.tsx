import { categoryIcon } from "@/lib/categoryIcons";

type Category = { id: string; name: string; slug: string };

export default function CategoryMarquee({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  // Duplicate the list so the track can scroll exactly 50% and loop seamlessly.
  const track = [...categories, ...categories];

  return (
    <div className="marquee-mask relative overflow-hidden">
      <div className="marquee-track flex w-max gap-4 py-1">
        {track.map((c, i) => (
          <span
            key={`${c.id}-${i}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <span className="text-lg" aria-hidden>
              {categoryIcon(c.slug)}
            </span>
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
