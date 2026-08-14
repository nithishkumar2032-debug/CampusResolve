import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { EscalationBanner } from "@/components/escalation-banner";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getStats, listComplaintsForUser } from "@/lib/demo-store";
import { CATEGORIES } from "@/lib/constants";

export default async function AdminDashboard() {
  const user = await requireUser(["admin"]);
  const stats = await getStats();
  const escalated = await listComplaintsForUser(user);

  return (
    <AppShell
      user={user}
      title="System Health Overview"
      subtitle="Monitor escalations, emergencies, and intervention queue."
    >
      <EscalationBanner count={stats.escalated} href="/admin" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total tickets" value={stats.total} />
        <KpiCard label="Open" value={stats.open} tone="info" />
        <KpiCard label="Escalated" value={stats.escalated} tone="danger" />
        <KpiCard label="Overdue" value={stats.overdue} tone="danger" />
        <KpiCard label="Resolved/closed" value={stats.resolved} tone="success" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="cr-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-navy">By category</h2>
          <ul className="space-y-2">
            {Object.entries(stats.byCategory).map(([key, count]) => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span>{CATEGORIES.find((c) => c.value === key)?.label ?? key}</span>
                <span className="font-semibold text-navy">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cr-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-navy">Invite staff account</h2>
          <form action={createStaffAction} className="space-y-3">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" type="password" required minLength={6} className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                defaultValue="worker"
              >
                <option value="warden">Warden</option>
                <option value="worker">Worker</option>
              </select>
            </div>
            <div>
              <Label htmlFor="hostel_block">Hostel block (optional)</Label>
              <Input id="hostel_block" name="hostel_block" className="rounded-lg" />
            </div>
            <Button type="submit" className="rounded-lg bg-navy hover:bg-navy-deep">
              Create account
            </Button>
          </form>
        </div>
      </div>

      <div className="cr-card overflow-hidden">
        <div className="border-b border-outline-variant bg-navy px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Intervention Queue</h2>
        </div>
        {escalated.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
            No escalated cases right now.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {escalated.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tickets/${t.id}`}
                className="flex flex-col gap-3 px-4 py-4 transition hover:bg-error-soft/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{t.ticket_id}</p>
                  <p className="text-sm font-medium text-destructive">
                    {t.escalation_reason ?? "Escalated"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-on-surface">{t.description}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {format(new Date(t.updated_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={t.status} />
                  <UrgencyBadge urgency={t.urgency} />
                  <EscalatedBadge />
                  <span className="rounded bg-destructive px-2 py-1 text-xs font-semibold text-white">
                    Intervene
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
