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
