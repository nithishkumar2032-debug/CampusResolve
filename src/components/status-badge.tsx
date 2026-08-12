import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { ComplaintStatus, Urgency } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClass: Record<ComplaintStatus, string> = {
  submitted: "bg-slate-100 text-slate-800",
  under_review: "bg-amber-100 text-amber-900",
  assigned: "bg-sky-100 text-sky-900",
  in_progress: "bg-indigo-100 text-indigo-900",
  resolved: "bg-emerald-100 text-emerald-900",
  closed: "bg-teal-100 text-teal-900",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", statusClass[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const cls =
    urgency === "emergency"
      ? "bg-red-100 text-red-800"
      : urgency === "high"
        ? "bg-orange-100 text-orange-900"
        : urgency === "medium"
          ? "bg-yellow-100 text-yellow-900"
          : "bg-slate-100 text-slate-700";
  return (
    <Badge variant="secondary" className={cn("capitalize", cls)}>
      {urgency}
    </Badge>
  );
}
