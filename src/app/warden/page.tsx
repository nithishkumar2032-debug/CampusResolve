import { AppShell } from "@/components/app-shell";
import { EscalationBanner } from "@/components/escalation-banner";
import { ComplaintFilters } from "@/components/complaint-filters";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth";
import { isOverdue } from "@/lib/complaints/deadlines";
import { getStore, listAllComplaints } from "@/lib/data";

export default async function WardenDashboard() {
  const user = await requireUser(["warden", "admin"]);
  const tickets = await listAllComplaints();
  const store = await getStore();
  const open = tickets.filter((t) => t.status !== "closed");
  const escalated = tickets.filter((t) => t.is_escalated).length;
  const unassigned = tickets.filter((t) =>
    ["submitted", "under_review"].includes(t.status),
  ).length;
  const overdue = tickets.filter(
    (t) =>
      t.status !== "closed" &&
      t.status !== "resolved" &&
      (isOverdue(t.response_deadline) || isOverdue(t.resolution_deadline)),
  ).length;
  const emergency = tickets.filter(
    (t) => t.urgency === "emergency" && t.status !== "closed",
  ).length;

  return (
    <AppShell
      user={user}
      title="Complaints Management"
      subtitle="Review, prioritize, and assign maintenance work."
    >
      <EscalationBanner count={escalated} href={user.role === "admin" ? "/admin" : "/warden"} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Open" value={open.length} tone="info" />
        <KpiCard label="Unassigned" value={unassigned} />
        <KpiCard label="Overdue" value={overdue} tone="danger" />
        <KpiCard label="Escalated" value={escalated} tone="danger" />
        <KpiCard label="Emergency" value={emergency} tone="danger" />
      </div>

      <div className="mb-4 text-sm text-on-surface-variant">
        Workers online:{" "}
        <span className="font-semibold text-navy">
          {store.profiles.filter((p) => p.role === "worker").length}
        </span>
      </div>

      <ComplaintFilters tickets={tickets} detailBase="/warden/tickets" />
    </AppShell>
  );
}
