// Lets independent header overlays (search palette, notification bell, …)
// know when a sibling opens, so opening one closes any other that's open —
// otherwise two overlays can be mounted at once and only the topmost one's
// backdrop click/Escape actually closes anything.
export const OVERLAY_OPEN_EVENT = "campusbin:overlay-open";

export function announceOverlayOpen(id: string) {
  window.dispatchEvent(new CustomEvent<string>(OVERLAY_OPEN_EVENT, { detail: id }));
}

export function onOtherOverlayOpen(id: string, onOpen: () => void) {
  function handler(e: Event) {
    if ((e as CustomEvent<string>).detail !== id) onOpen();
  }
  window.addEventListener(OVERLAY_OPEN_EVENT, handler);
  return () => window.removeEventListener(OVERLAY_OPEN_EVENT, handler);
}

// The search palette owns its own open state, but its trigger sits in a
// different part of the header on mobile (an icon in the right-hand
// cluster) than on desktop (a pill in the middle). Rather than split the
// trigger out of the component, the icon just asks the palette to open.
export const SEARCH_OPEN_EVENT = "campusbin:search-open";

export function requestSearchOpen() {
  window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
}

export function onSearchOpenRequest(onOpen: () => void) {
  window.addEventListener(SEARCH_OPEN_EVENT, onOpen);
  return () => window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
}
