import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getStats, listComplaintsForUser } from "@/lib/demo-store";

export default async function AdminDashboard() {
  const user = await requireUser(["admin"]);
  const stats = await getStats();
  const escalated = await listComplaintsForUser(user);

  return (
    <AppShell
      user={user}
      title="Escalations & performance"
      nav={[
        { href: "/admin", label: "Escalations" },
        { href: "/warden", label: "All queue" },
      ]}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total tickets", value: stats.total },
          { label: "Open", value: stats.open },
          { label: "Escalated", value: stats.escalated },
          { label: "Resolved/closed", value: stats.resolved },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Escalated & emergency</h2>
      <div className="grid gap-3">
        {escalated.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-600">
              No escalated cases right now.
            </CardContent>
          </Card>
        ) : (
          escalated.map((t) => (
            <Link key={t.id} href={`/admin/tickets/${t.id}`}>
              <Card className="border-red-100 transition hover:ring-2 hover:ring-red-200">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{t.ticket_id}</CardTitle>
                    <p className="text-sm text-red-700">
                      {t.escalation_reason ?? "Escalated"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusBadge status={t.status} />
                    <UrgencyBadge urgency={t.urgency} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm">{t.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {format(new Date(t.updated_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
