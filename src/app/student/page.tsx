import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { listComplaintsForUser } from "@/lib/demo-store";

export default async function StudentDashboard() {
  const user = await requireUser(["student"]);
  const tickets = await listComplaintsForUser(user);
  const active = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <AppShell
      user={user}
      title={`Welcome back, ${user.full_name.split(" ")[0]}`}
      subtitle="Need something fixed? Submit a request and track it here."
      actions={
        <Link
          href="/student/new"
          className="inline-flex h-9 items-center rounded bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
        >
          New Complaint
        </Link>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active" value={active} tone="info" />
        <KpiCard label="In Progress" value={inProgress} />
        <KpiCard label="Resolved" value={resolved} tone="success" />
        <KpiCard label="Total" value={tickets.length} />
      </div>

      <div className="cr-card overflow-hidden">
        <div className="border-b border-outline-variant bg-navy px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Recent Requests</h2>
        </div>
        {tickets.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-on-surface-variant">
            No tickets yet.{" "}
            <Link href="/student/new" className="font-semibold text-royal hover:underline">
              Submit your first request
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/student/tickets/${t.id}`}
                className="flex flex-col gap-2 px-4 py-4 transition hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{t.ticket_id}</p>
                  <p className="truncate text-sm text-on-surface-variant">{t.hostel_location}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-on-surface">{t.description}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {CATEGORIES.find((c) => c.value === t.category)?.label} ·{" "}
                    {format(new Date(t.created_at), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={t.status} />
                  <UrgencyBadge urgency={t.urgency} />
                  {t.is_escalated ? <EscalatedBadge /> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
