import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { TicketTimeline } from "@/components/ticket-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { acceptAction, resolveAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getComplaint, getEvents, getStore } from "@/lib/demo-store";

export default async function WorkerTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["worker"]);
  const complaint = await getComplaint(id);
  if (!complaint || complaint.assigned_worker_id !== user.id) notFound();
  const events = await getEvents(complaint.id);
  const store = await getStore();

  return (
    <AppShell user={user} title={complaint.ticket_id} nav={[{ href: "/worker", label: "Tasks" }]}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Task details</CardTitle>
              <div className="flex gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge urgency={complaint.urgency} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Location:</span> {complaint.hostel_location}
              </p>
              <p className="whitespace-pre-wrap">{complaint.description}</p>
              {complaint.resolution_deadline ? (
                <p className="text-xs text-slate-500">
                  Due by {new Date(complaint.resolution_deadline).toLocaleString()}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {complaint.status === "assigned" ? (
            <Card>
              <CardContent className="pt-6">
                <form
                  action={async () => {
                    "use server";
                    await acceptAction(complaint.id);
                  }}
                >
                  <Button type="submit" className="rounded bg-navy hover:bg-navy-deep">
                    Accept & start work
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {complaint.status === "in_progress" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mark resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={resolveAction} encType="multipart/form-data" className="space-y-3">
                  <input type="hidden" name="complaint_id" value={complaint.id} />
                  <Textarea
                    name="notes"
                    required
                    placeholder="Describe the action taken"
                    className="min-h-24 rounded-lg"
                  />
                  <div>
                    <label htmlFor="completion_file" className="mb-1 block text-sm font-medium">
                      Completion evidence (optional)
                    </label>
                    <Input
                      id="completion_file"
                      name="completion_file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="rounded-lg"
                    />
                  </div>
                  <Button type="submit" className="rounded-lg bg-navy hover:bg-navy-deep">
                    Submit resolution
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
