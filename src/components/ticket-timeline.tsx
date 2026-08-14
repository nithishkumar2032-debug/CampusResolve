import { format } from "date-fns";
import type { ComplaintEvent, Profile } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

export function TicketTimeline({
  events,
  profiles,
}: {
  events: ComplaintEvent[];
  profiles: Profile[];
}) {
  const nameOf = (id: string) =>
    id === "system" ? "System" : profiles.find((p) => p.id === id)?.full_name ?? "User";

  return (
    <ol className="relative space-y-4 border-l border-outline-variant pl-4">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full bg-royal" />
          <div className="rounded border border-outline-variant bg-white p-3">
            <p className="text-sm font-medium text-navy">{e.note}</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {nameOf(e.actor_id)}
              {e.to_status && e.from_status !== e.to_status
                ? ` · ${e.from_status ? STATUS_LABELS[e.from_status] : "—"} → ${STATUS_LABELS[e.to_status]}`
                : null}
              {" · "}
              {format(new Date(e.created_at), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
