const STORAGE_KEY = "recentSearches";
const MAX_ITEMS = 5;

export function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const existing = getRecentSearches().filter(
      (q) => q.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private mode, etc.) — safe to ignore
  }
}

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
