import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getStore, listAllComplaints } from "@/lib/demo-store";

export default async function WardenDashboard() {
  const user = await requireUser(["warden", "admin"]);
  const tickets = await listAllComplaints();
  const store = await getStore();
  const open = tickets.filter((t) => t.status !== "closed");

  return (
    <AppShell
      user={user}
      title="Warden queue"
      nav={[
        { href: "/warden", label: "Queue" },
        ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
      ]}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Open</p>
            <p className="text-2xl font-semibold">{open.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Escalated</p>
            <p className="text-2xl font-semibold text-red-700">
              {tickets.filter((t) => t.is_escalated).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Workers</p>
            <p className="text-2xl font-semibold">
              {store.profiles.filter((p) => p.role === "worker").length}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3">
        {tickets.map((t) => (
          <Link key={t.id} href={`/warden/tickets/${t.id}`}>
            <Card className="transition hover:ring-2 hover:ring-teal-200">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{t.ticket_id}</CardTitle>
                  <p className="text-sm text-slate-600">{t.hostel_location}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge status={t.status} />
                  <UrgencyBadge urgency={t.urgency} />
                  {t.is_escalated ? (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Escalated
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm">{t.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
