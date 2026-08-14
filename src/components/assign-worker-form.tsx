"use client";

import { useMemo, useState } from "react";
import { assignAction } from "@/lib/actions";
import { URGENCIES } from "@/lib/constants";
import { deadlinesFromUrgency, formatSlaLabel } from "@/lib/complaints/deadlines";
import type { Profile, Urgency } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function AssignWorkerForm({
  complaintId,
  workers,
  defaultUrgency,
}: {
  complaintId: string;
  workers: Profile[];
  defaultUrgency: Urgency;
}) {
  const [urgency, setUrgency] = useState<Urgency>(defaultUrgency);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => deadlinesFromUrgency(urgency), [urgency]);

  return (
    <form
      action={async (fd) => {
        setError(null);
        setPending(true);
        try {
          await assignAction(fd);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Assignment failed");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="complaint_id" value={complaintId} />
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="worker_id">
          Worker
        </label>
        <select
          id="worker_id"
          name="worker_id"
          required
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
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
        <label className="mb-1 block text-sm font-medium" htmlFor="urgency">
          Confirm urgency
        </label>
        <select
          id="urgency"
          name="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as Urgency)}
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          {URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-lg border border-royal/20 bg-blue-50 p-3 text-sm text-navy">
        <p className="font-semibold">Deadline preview</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Response SLA: {formatSlaLabel(preview.response_minutes)} · Resolution SLA:{" "}
          {formatSlaLabel(preview.resolution_minutes)}
        </p>
        <p className="mt-1 text-xs">
          Response by {format(new Date(preview.response_deadline), "dd MMM yyyy, HH:mm")}
        </p>
        <p className="text-xs">
          Resolve by {format(new Date(preview.resolution_deadline), "dd MMM yyyy, HH:mm")}
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="rounded-lg bg-navy hover:bg-navy-deep" disabled={pending}>
        {pending ? "Assigning…" : "Assign worker & set deadlines"}
      </Button>
    </form>
  );
}
