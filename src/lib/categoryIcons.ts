export const CATEGORY_ICONS: Record<string, string> = {
  books: "📚",
  electronics: "💻",
  cycles: "🚲",
  "hostel-essentials": "🏠",
  fashion: "👕",
  furniture: "🛋️",
  sports: "⚽",
  stationery: "📐",
  "musical-instruments": "🎸",
  gaming: "🎮",
  vehicles: "🛵",
  appliances: "🔌",
  other: "📦",
};

export function categoryIcon(slug: string) {
  return CATEGORY_ICONS[slug] ?? "🏷️";
}
