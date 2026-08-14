import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth";
import { isOverdue } from "@/lib/complaints/deadlines";
import { listComplaintsForUser } from "@/lib/demo-store";

export default async function WorkerDashboard() {
  const user = await requireUser(["worker"]);
  const tickets = await listComplaintsForUser(user);
  const nowMs = new Date().getTime();
  const todo = tickets.filter((t) => t.status === "assigned");
  const active = tickets.filter((t) => t.status === "in_progress");
  const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
  const overdue = open.filter(
    (t) => isOverdue(t.response_deadline) || isOverdue(t.resolution_deadline),
  );
  const dueSoon = open.filter((t) => {
    if (!t.resolution_deadline || isOverdue(t.resolution_deadline)) return false;
    const hrs = (new Date(t.resolution_deadline).getTime() - nowMs) / (1000 * 60 * 60);
    return hrs <= 4;
  });

  const sections = [
    { key: "todo", title: "To-Do", list: todo },
    { key: "active", title: "In Progress", list: active },
    {
      key: "done",
      title: "Completed",
      list: tickets.filter((t) => t.status === "resolved" || t.status === "closed"),
    },
  ];

  return (
    <AppShell
      user={user}
      title="My Assigned Tasks"
      subtitle="Accept work, update progress, and submit resolution evidence."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Assigned" value={todo.length} tone="info" />
        <KpiCard label="In Progress" value={active.length} />
        <KpiCard label="Due soon" value={dueSoon.length} />
        <KpiCard label="Overdue" value={overdue.length} tone="danger" />
      </div>

      {tickets.length === 0 ? (
        <div className="cr-card px-4 py-12 text-center text-sm text-on-surface-variant">
          No assigned tasks yet. Wait for the warden to assign work.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) =>
            section.list.length === 0 ? null : (
              <section key={section.key}>
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-on-surface-variant uppercase">
                  {section.title}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {section.list.map((t) => {
                    const late =
                      t.status !== "closed" &&
                      t.status !== "resolved" &&
                      (isOverdue(t.response_deadline) || isOverdue(t.resolution_deadline));
                    return (
                      <Link key={t.id} href={`/worker/tickets/${t.id}`} className="cr-card p-4">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <StatusBadge status={t.status} />
                          <UrgencyBadge urgency={t.urgency} />
                          {late ? (
                            <span className="rounded bg-destructive px-2 py-0.5 text-xs font-semibold text-white">
                              Overdue
                            </span>
                          ) : null}
                        </div>
                        <p className="font-semibold text-navy">{t.ticket_id}</p>
                        <p className="text-sm text-on-surface-variant">{t.hostel_location}</p>
                        <p className="mt-2 line-clamp-2 text-sm">{t.description}</p>
                        {t.resolution_deadline ? (
                          <p
                            className={`mt-2 text-xs ${late ? "font-semibold text-destructive" : "text-on-surface-variant"}`}
                          >
                            Resolution {late ? "was due" : "due"}{" "}
                            {formatDistanceToNow(new Date(t.resolution_deadline), {
                              addSuffix: true,
                            })}{" "}
                            ({format(new Date(t.resolution_deadline), "dd MMM, HH:mm")})
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs font-semibold text-royal">
                          {t.status === "assigned"
                            ? "Open to Accept Task →"
                            : t.status === "in_progress"
                              ? "Open to Mark Resolved →"
                              : "View details →"}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </AppShell>
  );
}
