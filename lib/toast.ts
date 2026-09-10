// Fire a toast from anywhere (client only). The <Toaster/> mounted in the root
// layout listens for these events and renders them.
export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fluxion-toast", { detail: message }));
}
