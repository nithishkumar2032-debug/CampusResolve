import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { TicketTimeline } from "@/components/ticket-timeline";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentAction, verifyAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { isOverdue } from "@/lib/complaints/deadlines";
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
  const worker = store.profiles.find((p) => p.id === complaint.assigned_worker_id);
  const responseLate = isOverdue(complaint.response_deadline);
  const resolutionLate = isOverdue(complaint.resolution_deadline);

  return (
    <AppShell
      user={user}
      title={complaint.ticket_id}
      subtitle={complaint.hostel_location}
      actions={
        <Link href="/student" className="text-sm font-semibold text-royal hover:underline">
          ← Back to dashboard
        </Link>
      }
    >
      <div className="mb-6 cr-card p-4">
        <p className="cr-label mb-3">Resolution Progress</p>
        <WorkflowStepper status={complaint.status} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="cr-card p-4 text-sm">
          <p className="text-on-surface-variant">Responsible worker</p>
          <p className="font-semibold text-navy">{worker?.full_name ?? "Not assigned yet"}</p>
        </div>
        <div className="cr-card p-4 text-sm">
          <p className="text-on-surface-variant">Deadlines</p>
          {complaint.response_deadline ? (
            <p className={responseLate ? "font-semibold text-destructive" : ""}>
              Response: {format(new Date(complaint.response_deadline), "dd MMM, HH:mm")}
              {responseLate ? " (overdue)" : ""}
            </p>
          ) : (
            <p>Response: set on assignment</p>
          )}
          {complaint.resolution_deadline ? (
            <p className={resolutionLate ? "font-semibold text-destructive" : ""}>
              Resolution: {format(new Date(complaint.resolution_deadline), "dd MMM, HH:mm")} (
              {formatDistanceToNow(new Date(complaint.resolution_deadline), { addSuffix: true })})
            </p>
          ) : (
            <p>Resolution: set on assignment</p>
          )}
        </div>
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
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {attachments.map((a) => (
                    <div key={a.id} className="rounded-lg border border-outline-variant p-2">
                      <p className="mb-1 text-xs font-medium capitalize text-on-surface-variant">
                        {a.kind}
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.storage_path}
                        alt={`${a.kind} evidence`}
                        className="max-h-40 w-full rounded object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {complaint.status === "resolved" ? (
            <div className="cr-card p-5">
              <h3 className="mb-3 text-base font-semibold text-navy">Verify resolution</h3>
              <form action={verifyAction} className="space-y-3">
                <input type="hidden" name="complaint_id" value={complaint.id} />
                <Textarea
                  name="comment"
                  placeholder="Optional on accept — required if you reject"
                  className="min-h-20 rounded-lg"
                  aria-describedby="reject-hint"
                />
                <p id="reject-hint" className="text-xs text-on-surface-variant">
                  Rejecting requires a clear reason and will reopen + escalate the ticket.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    name="decision"
                    value="accept"
                    type="submit"
                    className="rounded-lg bg-navy hover:bg-navy-deep"
                  >
                    Accept Resolution
                  </Button>
                  <Button
                    name="decision"
                    value="reject"
                    type="submit"
                    variant="destructive"
                    className="rounded-lg"
                  >
                    Reject & reopen
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
