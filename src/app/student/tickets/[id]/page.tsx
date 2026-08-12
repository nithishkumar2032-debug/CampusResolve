import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { TicketTimeline } from "@/components/ticket-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { commentAction, verifyAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import {
  getAttachments,
  getComplaint,
  getEvents,
  getStore,
} from "@/lib/demo-store";

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
      nav={[
        { href: "/student", label: "Dashboard" },
        { href: "/student/new", label: "New request" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Request details</CardTitle>
              <div className="flex gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge urgency={complaint.urgency} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Category:</span>{" "}
                {CATEGORIES.find((c) => c.value === complaint.category)?.label}
              </p>
              <p>
                <span className="text-slate-500">Location:</span> {complaint.hostel_location}
              </p>
              <p className="whitespace-pre-wrap text-slate-800">{complaint.description}</p>
              {complaint.resolution_notes ? (
                <p className="rounded-md bg-emerald-50 p-3 text-emerald-900">
                  <strong>Worker notes:</strong> {complaint.resolution_notes}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">
                Opened {format(new Date(complaint.created_at), "dd MMM yyyy, HH:mm")}
              </p>
              {attachments.length > 0 ? (
                <ul className="text-xs text-slate-600">
                  {attachments.map((a) => (
                    <li key={a.id}>
                      {a.kind}: {a.storage_path}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          {complaint.status === "resolved" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verify resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={verifyAction} className="space-y-3">
                  <input type="hidden" name="complaint_id" value={complaint.id} />
                  <Textarea
                    name="comment"
                    placeholder="Optional comment"
                    className="min-h-20"
                  />
                  <div className="flex gap-2">
                    <Button
                      name="decision"
                      value="accept"
                      type="submit"
                      className="bg-teal-700 hover:bg-teal-600"
                    >
                      Accept & close
                    </Button>
                    <Button name="decision" value="reject" type="submit" variant="destructive">
                      Reject & reopen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add comment</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={commentAction} className="space-y-3">
                <input type="hidden" name="complaint_id" value={complaint.id} />
                <Textarea name="note" required placeholder="Update or question for staff" />
                <Button type="submit" variant="outline">
                  Post comment
                </Button>
              </form>
            </CardContent>
          </Card>
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
