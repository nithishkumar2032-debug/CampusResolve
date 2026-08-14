import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { TicketTimeline } from "@/components/ticket-timeline";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentAction, verifyAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { getAttachments, getComplaint, getEvents, getStore } from "@/lib/demo-store";

export default async function StudentTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["student"]);
  const complaint = await getComplaint(id);
  if (!complaint || complaint.student_id !== user.id) notFound();
  const events = await getEvents(complaint.id);
  const attachments = await getAttachments(complaint.id);
  const store = await getStore();

  return (
    <AppShell
      user={user}
      title={complaint.ticket_id}
      subtitle={complaint.hostel_location}
    >
      <div className="mb-6 cr-card p-4">
        <p className="cr-label mb-3">Resolution Progress</p>
        <WorkflowStepper status={complaint.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="cr-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-navy">Request details</h2>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge urgency={complaint.urgency} />
                {complaint.is_escalated ? <EscalatedBadge /> : null}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-on-surface-variant">Category:</span>{" "}
                {CATEGORIES.find((c) => c.value === complaint.category)?.label}
              </p>
              <p>
                <span className="text-on-surface-variant">Location:</span>{" "}
                {complaint.hostel_location}
              </p>
              <p className="whitespace-pre-wrap text-on-surface">{complaint.description}</p>
              {complaint.resolution_notes ? (
                <p className="rounded border border-teal-200 bg-teal-50 p-3 text-resolved">
                  <strong>Worker notes:</strong> {complaint.resolution_notes}
                </p>
              ) : null}
              <p className="text-xs text-on-surface-variant">
                Opened {format(new Date(complaint.created_at), "dd MMM yyyy, HH:mm")}
              </p>
              {attachments.length > 0 ? (
                <ul className="text-xs text-on-surface-variant">
                  {attachments.map((a) => (
                    <li key={a.id}>
                      {a.kind}: {a.storage_path}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {complaint.status === "resolved" ? (
            <div className="cr-card p-5">
              <h3 className="mb-3 text-base font-semibold text-navy">Verify resolution</h3>
              <form action={verifyAction} className="space-y-3">
                <input type="hidden" name="complaint_id" value={complaint.id} />
                <Textarea name="comment" placeholder="Optional comment" className="min-h-20 rounded" />
                <div className="flex flex-wrap gap-2">
                  <Button
                    name="decision"
                    value="accept"
                    type="submit"
                    className="rounded bg-navy hover:bg-navy-deep"
                  >
                    Accept Resolution
                  </Button>
                  <Button name="decision" value="reject" type="submit" variant="destructive" className="rounded">
                    Reopen Complaint
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="cr-card p-5">
            <h3 className="mb-3 text-base font-semibold text-navy">Add comment</h3>
            <form action={commentAction} className="space-y-3">
              <input type="hidden" name="complaint_id" value={complaint.id} />
              <Textarea name="note" required placeholder="Update or question for staff" className="rounded" />
              <Button type="submit" variant="outline" className="rounded">
                Post comment
              </Button>
            </form>
          </div>
        </div>

        <div className="cr-card p-5">
          <h3 className="mb-4 text-base font-semibold text-navy">Activity history</h3>
          <TicketTimeline events={events} profiles={store.profiles} />
        </div>
      </div>
    </AppShell>
  );
}
