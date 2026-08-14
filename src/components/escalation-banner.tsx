import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function EscalationBanner({
  count,
  href = "/admin",
}: {
  count: number;
  href?: string;
}) {
  if (count <= 0) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded border border-destructive/30 bg-error-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            {count} escalated case{count === 1 ? "" : "s"} need attention
          </p>
          <p className="text-xs text-on-error-container/80">
            Overdue, rejected, or emergency tickets are flagged for intervention.
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex h-8 items-center justify-center rounded bg-destructive px-3 text-xs font-semibold text-white hover:bg-red-800"
      >
        Review queue
      </Link>
    </div>
  );
}
