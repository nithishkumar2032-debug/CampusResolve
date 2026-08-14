import { WorkflowStepper } from "@/components/workflow-stepper";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignAction, reviewAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, URGENCIES } from "@/lib/constants";
import { getComplaint, getEvents, getStore, listWorkers } from "@/lib/demo-store";
import { TicketTimeline } from "@/components/ticket-timeline";
import { AppShell } from "@/components/app-shell";
import { notFound } from "next/navigation";

export default async function WardenTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["warden", "admin"]);
  const complaint = await getComplaint(id);
  if (!complaint) notFound();
  const events = await getEvents(complaint.id);
  const workers = await listWorkers();
  const store = await getStore();
  const student = store.profiles.find((p) => p.id === complaint.student_id);

  return (
    <AppShell
      user={user}
      title={complaint.ticket_id}
      nav={[{ href: "/warden", label: "Queue" }]}
    >
      <div className="mb-6 cr-card p-4">
        <p className="cr-label mb-3">Workflow</p>
        <WorkflowStepper status={complaint.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Review & assign</CardTitle>
              <div className="flex gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge urgency={complaint.urgency} />
                {complaint.is_escalated ? <EscalatedBadge /> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Student:</span> {student?.full_name}
              </p>
              <p>
                <span className="text-slate-500">Category:</span>{" "}
                {CATEGORIES.find((c) => c.value === complaint.category)?.label}
              </p>
              <p>
                <span className="text-slate-500">Location:</span> {complaint.hostel_location}
              </p>
              <p className="whitespace-pre-wrap">{complaint.description}</p>
              {complaint.response_deadline ? (
                <p className="text-xs text-slate-500">
                  Response deadline: {new Date(complaint.response_deadline).toLocaleString()}
                </p>
              ) : null}
              {complaint.resolution_deadline ? (
                <p className="text-xs text-slate-500">
                  Resolution deadline: {new Date(complaint.resolution_deadline).toLocaleString()}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {["submitted", "under_review"].includes(complaint.status) ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                {complaint.status === "submitted" ? (
                  <form
                    action={async () => {
                      "use server";
                      await reviewAction(complaint.id);
                    }}
                  >
                    <Button type="submit" variant="outline">
                      Mark under review
                    </Button>
                  </form>
                ) : null}
                <form action={assignAction} className="space-y-3">
                  <input type="hidden" name="complaint_id" value={complaint.id} />
                  <div>
                    <label className="mb-1 block text-sm font-medium">Worker</label>
                    <select
                      name="worker_id"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      defaultValue={workers[0]?.id}
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Confirm urgency</label>
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
                  </div>
                  <Button type="submit" className="rounded bg-navy hover:bg-navy-deep">
                    Assign worker & set deadlines
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
