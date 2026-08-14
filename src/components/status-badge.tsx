import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { ComplaintStatus, Urgency } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClass: Record<ComplaintStatus, string> = {
  submitted: "bg-slate-100 text-slate-800 border-slate-200",
  under_review: "bg-amber-50 text-amber-900 border-amber-200",
  assigned: "bg-blue-50 text-royal border-blue-200",
  in_progress: "bg-yellow-50 text-yellow-900 border-yellow-200",
  resolved: "bg-teal-50 text-resolved border-teal-200",
  closed: "bg-emerald-50 text-emerald-900 border-emerald-200",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("rounded border font-semibold", statusClass[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const cls =
    urgency === "emergency"
      ? "bg-error-soft text-destructive border-destructive/30"
      : urgency === "high"
        ? "bg-orange-50 text-orange-800 border-orange-200"
        : urgency === "medium"
          ? "bg-yellow-50 text-yellow-900 border-yellow-200"
          : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <Badge variant="secondary" className={cn("rounded border capitalize font-semibold", cls)}>
      {urgency}
    </Badge>
  );
}

export function EscalatedBadge() {
  return (
    <Badge
      variant="secondary"
      className="rounded border border-destructive/30 bg-error-soft font-semibold text-destructive"
    >
      Escalated
    </Badge>
  );
}
