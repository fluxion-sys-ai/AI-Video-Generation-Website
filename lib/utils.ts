export { cn } from "cn"

/** "2h ago"-style label for a Unix timestamp in seconds. */
export function timeAgo(unixSeconds: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.round(now / 1000 - unixSeconds))
  if (s < 60) return "Just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return "Yesterday"
  if (d < 7) return `${d} days ago`
  const w = Math.floor(d / 7)
  if (w < 5) return w === 1 ? "Last week" : `${w} weeks ago`
  const mo = Math.floor(d / 30)
  return mo <= 1 ? "Last month" : `${mo} months ago`
}
