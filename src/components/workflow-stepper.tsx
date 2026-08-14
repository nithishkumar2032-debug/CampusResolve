import { STATUS_LABELS } from "@/lib/constants";
import type { ComplaintStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: ComplaintStatus[] = [
  "submitted",
  "under_review",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

export function WorkflowStepper({ status }: { status: ComplaintStatus }) {
  const current = STEPS.indexOf(status);

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center sm:flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-navy text-white" : "bg-surface-container text-on-surface-variant",
                  active && "ring-2 ring-royal ring-offset-2",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-[11px]",
                  done ? "text-navy" : "text-on-surface-variant",
                )}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mx-2 hidden h-0.5 flex-1 sm:block",
                  i < current ? "bg-navy" : "bg-outline-variant",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
