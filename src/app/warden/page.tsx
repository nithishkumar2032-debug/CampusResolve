import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { EscalationBanner } from "@/components/escalation-banner";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth";
import { getStore, listAllComplaints } from "@/lib/demo-store";

export default async function WardenDashboard() {
  const user = await requireUser(["warden", "admin"]);
  const tickets = await listAllComplaints();
  const store = await getStore();
  const open = tickets.filter((t) => t.status !== "closed");
  const escalated = tickets.filter((t) => t.is_escalated).length;
  const needsAssign = tickets.filter((t) =>
    ["submitted", "under_review"].includes(t.status),
  ).length;

  return (
    <AppShell
      user={user}
      title="Complaints Management"
      subtitle="Review, prioritize, and assign maintenance work."
    >
      <EscalationBanner count={escalated} href={user.role === "admin" ? "/admin" : "/warden"} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open" value={open.length} tone="info" />
        <KpiCard label="Needs assign" value={needsAssign} />
        <KpiCard label="Escalated" value={escalated} tone="danger" />
        <KpiCard
          label="Workers"
          value={store.profiles.filter((p) => p.role === "worker").length}
        />
      </div>

      <div className="cr-card overflow-hidden">
        <div className="border-b border-outline-variant bg-navy px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Complaint queue</h2>
        </div>
        <div className="divide-y divide-outline-variant">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/warden/tickets/${t.id}`}
              className="flex flex-col gap-3 px-4 py-4 transition hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-navy">{t.ticket_id}</p>
                <p className="text-sm text-on-surface-variant">{t.hostel_location}</p>
                <p className="mt-1 line-clamp-1 text-sm">{t.description}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={t.status} />
                <UrgencyBadge urgency={t.urgency} />
                {t.is_escalated ? <EscalatedBadge /> : null}
                {["submitted", "under_review"].includes(t.status) ? (
                  <span className="rounded bg-royal px-2 py-1 text-xs font-semibold text-white">
                    Assign Worker
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
