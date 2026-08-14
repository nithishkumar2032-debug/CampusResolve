import { addMinutes } from "date-fns";
import { SLA_MINUTES } from "../constants";
import type { Urgency } from "../types";

export function deadlinesFromUrgency(urgency: Urgency, from = new Date()) {
  const mins = SLA_MINUTES[urgency];
  return {
    response_deadline: addMinutes(from, mins.response).toISOString(),
    resolution_deadline: addMinutes(from, mins.resolution).toISOString(),
    response_minutes: mins.response,
    resolution_minutes: mins.resolution,
  };
}

export function formatSlaLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  if (Number.isInteger(h)) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${h.toFixed(1)} hours`;
}

export function priorityFromUrgency(urgency: Urgency): number {
  switch (urgency) {
    case "emergency":
      return 1;
    case "high":
      return 2;
    case "medium":
      return 3;
    default:
      return 4;
  }
}

export function isOverdue(
  deadline: string | null | undefined,
  now = new Date(),
): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < now.getTime();
}

export function hoursUntil(deadline: string | null | undefined, now = new Date()): number | null {
  if (!deadline) return null;
  return (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
}
