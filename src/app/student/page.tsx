import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ComplaintFilters } from "@/components/complaint-filters";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth";
import { listComplaintsForUser } from "@/lib/data";

export default async function StudentDashboard() {
  const user = await requireUser(["student"]);
  const tickets = await listComplaintsForUser(user);
  const open = tickets.filter((t) => !["closed", "resolved"].includes(t.status)).length;
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const escalated = tickets.filter((t) => t.is_escalated).length;

  return (
    <AppShell
      user={user}
      title={`Welcome back, ${user.full_name.split(" ")[0]}`}
      subtitle="Need something fixed? Submit a request and track it here."
      actions={
        <Link
          href="/student/new"
          className="inline-flex h-9 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
        >
          New Complaint
        </Link>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total" value={tickets.length} />
        <KpiCard label="Open" value={open} tone="info" />
        <KpiCard label="Resolved" value={resolved} tone="success" />
        <KpiCard label="Escalated" value={escalated} tone="danger" />
      </div>

      {tickets.length === 0 ? (
        <div className="cr-card px-4 py-12 text-center text-sm text-on-surface-variant">
          No tickets yet.{" "}
          <Link href="/student/new" className="font-semibold text-royal hover:underline">
            Submit your first request
          </Link>
        </div>
      ) : (
        <ComplaintFilters tickets={tickets} detailBase="/student/tickets" />
      )}
    </AppShell>
  );
}
