import { addHours } from "date-fns";
import { DEADLINE_HOURS } from "../constants";
import type { Urgency } from "../types";

export function deadlinesFromUrgency(urgency: Urgency, from = new Date()) {
  const hours = DEADLINE_HOURS[urgency];
  return {
    response_deadline: addHours(from, hours.response).toISOString(),
    resolution_deadline: addHours(from, hours.resolution).toISOString(),
  };
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
