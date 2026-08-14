"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { EscalatedBadge, StatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { CATEGORIES, STATUS_LABELS, URGENCIES } from "@/lib/constants";
import type { Complaint } from "@/lib/types";

export function ComplaintFilters({
  tickets,
  detailBase,
}: {
  tickets: Complaint[];
  detailBase: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const hay = `${t.ticket_id} ${t.description} ${t.hostel_location}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (status && t.status !== status) return false;
      if (urgency && t.urgency !== urgency) return false;
      if (category && t.category !== category) return false;
      return true;
    });
  }, [tickets, q, status, urgency, category]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tickets…"
          aria-label="Search tickets"
          className="rounded-lg"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          aria-label="Filter by urgency"
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All urgencies</option>
          {URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="cr-card overflow-hidden">
        <div className="border-b border-outline-variant bg-navy px-4 py-3">
          <h2 className="text-sm font-semibold text-white">
            Results ({filtered.length})
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
            No tickets match your filters.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`${detailBase}/${t.id}`}
                className="flex flex-col gap-2 px-4 py-4 transition hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{t.ticket_id}</p>
                  <p className="truncate text-sm text-on-surface-variant">{t.hostel_location}</p>
                  <p className="mt-1 line-clamp-1 text-sm">{t.description}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {CATEGORIES.find((c) => c.value === t.category)?.label} ·{" "}
                    {format(new Date(t.updated_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={t.status} />
                  <UrgencyBadge urgency={t.urgency} />
                  {t.is_escalated ? <EscalatedBadge /> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
