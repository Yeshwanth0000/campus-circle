const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 10;

export function recordViewed(listingId: string) {
  try {
    const existing = getViewedIds().filter((id) => id !== listingId);
    const updated = [listingId, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private mode, etc.) — safe to ignore
  }
}

export function getViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
