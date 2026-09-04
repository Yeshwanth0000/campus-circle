"use client";

import { useState } from "react";
import Link from "next/link";
import { categoryIcon } from "@/lib/categoryIcons";

export default function CategoryExplorer({
  categories,
  href,
}: {
  categories: { id: string; name: string; slug: string }[];
  href: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={href}
          onMouseEnter={() => setHovered(c.id)}
          onMouseLeave={() => setHovered(null)}
          className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            className={`text-3xl transition-transform duration-300 ${
              hovered === c.id ? "scale-125 -rotate-6" : ""
            }`}
          >
            {categoryIcon(c.slug)}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
