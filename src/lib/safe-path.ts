/** Safe internal redirect — blocks open redirects */
export function safeInternalPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}
