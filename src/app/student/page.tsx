import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { listComplaintsForUser } from "@/lib/demo-store";

export default async function StudentDashboard() {
  const user = await requireUser(["student"]);
  const tickets = await listComplaintsForUser(user);

  return (
    <AppShell
      user={user}
      title="My requests"
      nav={[
        { href: "/student", label: "Dashboard" },
        { href: "/student/new", label: "New request" },
      ]}
    >
      <div className="mb-4 flex justify-end">
        <Link
          href="/student/new"
          className="inline-flex h-8 items-center rounded-lg bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-600"
        >
          New complaint
        </Link>
      </div>
      <div className="grid gap-3">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-slate-600">
              No tickets yet. Submit your first maintenance request.
            </CardContent>
          </Card>
        ) : (
          tickets.map((t) => (
            <Link key={t.id} href={`/student/tickets/${t.id}`}>
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
                  <p className="line-clamp-2 text-sm text-slate-700">{t.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {CATEGORIES.find((c) => c.value === t.category)?.label} ·{" "}
                    {format(new Date(t.created_at), "dd MMM yyyy")}
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
