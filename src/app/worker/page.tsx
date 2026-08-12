import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { listComplaintsForUser } from "@/lib/demo-store";

export default async function WorkerDashboard() {
  const user = await requireUser(["worker"]);
  const tickets = await listComplaintsForUser(user);

  return (
    <AppShell
      user={user}
      title="My tasks"
      nav={[{ href: "/worker", label: "Tasks" }]}
    >
      <div className="grid gap-3">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-slate-600">
              No assigned tasks yet. Wait for the warden to assign work.
            </CardContent>
          </Card>
        ) : (
          tickets.map((t) => (
            <Link key={t.id} href={`/worker/tickets/${t.id}`}>
              <Card className="transition hover:ring-2 hover:ring-teal-200">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{t.ticket_id}</CardTitle>
                    <p className="text-sm text-slate-600">{t.hostel_location}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusBadge status={t.status} />
                    <UrgencyBadge urgency={t.urgency} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm">{t.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Updated {format(new Date(t.updated_at), "dd MMM yyyy, HH:mm")}
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
