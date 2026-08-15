import { notFound } from "next/navigation";
import { AssignWorkerForm } from "@/components/assign-worker-form";
import { AppShell } from "@/components/app-shell";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { TicketTimeline } from "@/components/ticket-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getComplaint, getEvents, getStore, listWorkers } from "@/lib/data";

export const dynamic = "force-dynamic";

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
                {complaint.is_escalated ? <EscalatedBadge /> : null}
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
                <AssignWorkerForm
                  complaintId={complaint.id}
                  workers={workers}
                  defaultUrgency={complaint.urgency}
                />
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
