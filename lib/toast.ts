// Fire a toast from anywhere (client only). The <Toaster/> mounted in the root
// layout listens for these events and renders them.
//
// Two kinds, because they are read differently. An "info" toast is an
// acknowledgement - copied, saved, queued - and is gone in a couple of seconds
// because nobody needs to read it twice. An "error" is evidence: it carries
// what a provider said, often with a request id in it, and it stays until it is
// dismissed so it can be read, selected and copied into a bug report.

export type ToastKind = "info" | "error";

export function toast(message: string, kind: ToastKind = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fluxion-toast", { detail: { message, kind } }));
}
