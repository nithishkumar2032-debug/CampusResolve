import type { ComplaintStatus, UserRole } from "../types";

/** Allowed status transitions by role (server-side enforcement) */
const TRANSITIONS: Record<
  ComplaintStatus,
  Partial<Record<UserRole, ComplaintStatus[]>>
> = {
  submitted: {
    warden: ["under_review"],
    admin: ["under_review", "assigned"],
  },
  under_review: {
    warden: ["assigned"],
    admin: ["assigned"],
  },
  assigned: {
    worker: ["in_progress"],
    warden: ["assigned"], // reassignment keeps assigned
    admin: ["assigned"],
  },
  in_progress: {
    worker: ["resolved"],
    warden: ["assigned"],
    admin: ["assigned"],
  },
  resolved: {
    student: ["closed", "under_review"], // accept / reject
    admin: ["closed", "under_review"],
    warden: ["closed", "under_review"],
  },
  closed: {},
};

export function assertTransition(
  from: ComplaintStatus,
  to: ComplaintStatus,
  role: UserRole,
): void {
  if (from === to && (role === "warden" || role === "admin") && to === "assigned") {
    return; // reassign
  }
  const allowed = TRANSITIONS[from]?.[role] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid status transition: ${from} → ${to} is not allowed for role ${role}`,
    );
  }
}

export function canTransition(
  from: ComplaintStatus,
  to: ComplaintStatus,
  role: UserRole,
): boolean {
  try {
    assertTransition(from, to, role);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeText(input: string, max = 4000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}
