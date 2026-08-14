import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "success" | "info";
}) {
  const valueColor =
    tone === "danger"
      ? "text-destructive"
      : tone === "success"
        ? "text-resolved"
        : tone === "info"
          ? "text-royal"
          : "text-navy";

  return (
    <div className="cr-card p-4">
      <p className="cr-label">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tracking-tight", valueColor)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}
