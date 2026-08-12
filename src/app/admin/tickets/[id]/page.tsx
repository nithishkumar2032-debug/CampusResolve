import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { TicketTimeline } from "@/components/ticket-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { URGENCIES } from "@/lib/constants";
import { getComplaint, getEvents, getStore, listWorkers } from "@/lib/demo-store";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["admin"]);
  const complaint = await getComplaint(id);
  if (!complaint) notFound();
  const events = await getEvents(complaint.id);
  const workers = await listWorkers();
  const store = await getStore();

  return (
    <AppShell
      user={user}
      title={complaint.ticket_id}
      nav={[
        { href: "/admin", label: "Escalations" },
        { href: "/warden", label: "All queue" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Escalated case</CardTitle>
              <div className="flex gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge urgency={complaint.urgency} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {complaint.escalation_reason ? (
                <p className="rounded-md bg-red-50 p-3 text-red-900">
                  {complaint.escalation_reason}
                </p>
              ) : null}
              <p>
                <span className="text-slate-500">Location:</span> {complaint.hostel_location}
              </p>
              <p className="whitespace-pre-wrap">{complaint.description}</p>
            </CardContent>
          </Card>

          {complaint.status !== "closed" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reassign worker</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={assignAction} className="space-y-3">
                  <input type="hidden" name="complaint_id" value={complaint.id} />
                  <select
                    name="worker_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    defaultValue={complaint.assigned_worker_id ?? workers[0]?.id}
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.full_name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="urgency"
                    defaultValue={complaint.urgency}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {URGENCIES.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" className="bg-teal-700 hover:bg-teal-600">
                    Reassign & refresh deadlines
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity trail</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketTimeline events={events} profiles={store.profiles} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
