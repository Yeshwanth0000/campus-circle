export type ToastType = "success" | "error" | "info";

export function toast(message: string, type: ToastType = "success") {
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type } }));
}
