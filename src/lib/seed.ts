import { subHours, subMinutes } from "date-fns";
import { SEED_VERSION } from "./constants";
import { deadlinesFromUrgency, priorityFromUrgency } from "./complaints/deadlines";
import type { AppStore, Complaint, ComplaintEvent, EscalationRecord, Profile } from "./types";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Idempotent demonstration dataset — replaced only when SEED_VERSION changes */
export function buildSeedStore(): AppStore {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  const profiles: Profile[] = [
    {
      id: "user_student",
      email: "student@demo.edu",
      full_name: "Asha Student",
      role: "student",
      hostel_block: "Block B",
      password: "demo1234",
      created_at: iso(subHours(now, 200)),
    },
    {
      id: "user_warden",
      email: "warden@demo.edu",
      full_name: "Ravi Warden",
      role: "warden",
      hostel_block: "Block B",
      password: "demo1234",
      created_at: iso(subHours(now, 200)),
    },
    {
      id: "user_worker",
      email: "worker@demo.edu",
      full_name: "Kumar Technician",
      role: "worker",
      hostel_block: null,
      password: "demo1234",
      created_at: iso(subHours(now, 200)),
    },
    {
      id: "user_worker2",
      email: "worker2@demo.edu",
      full_name: "Priya Electrician",
      role: "worker",
      hostel_block: null,
      password: "demo1234",
      created_at: iso(subHours(now, 200)),
    },
    {
      id: "user_admin",
      email: "admin@demo.edu",
      full_name: "Dean Admin",
      role: "admin",
      hostel_block: null,
      password: "demo1234",
      created_at: iso(subHours(now, 200)),
    },
  ];

  const complaints: Complaint[] = [];
  const events: ComplaintEvent[] = [];
  const escalations: EscalationRecord[] = [];

  const pushEvent = (
    complaint_id: string,
    actor_id: string,
    actor_role: ComplaintEvent["actor_role"],
    from: ComplaintEvent["from_status"],
    to: ComplaintEvent["to_status"],
    note: string,
    at: Date,
  ) => {
    events.push({
      id: uid("evt"),
      complaint_id,
      actor_id,
      actor_role,
      from_status: from,
      to_status: to,
      note,
      created_at: iso(at),
    });
  };

  // 1. Submitted, Medium
  {
    const created = subHours(now, 2);
    const c: Complaint = {
      id: "cmp_submitted",
      ticket_id: "CR-2026-0001",
      student_id: "user_student",
      category: "plumbing",
      hostel_location: "Block B, Room 204",
      description: "Bathroom tap leaking continuously since yesterday evening.",
      urgency: "medium",
      status: "submitted",
      priority: 3,
      assigned_worker_id: null,
      response_deadline: null,
      resolution_deadline: null,
      is_escalated: false,
      escalation_reason: null,
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(created),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
  }

  // 2. Under Review
  {
    const created = subHours(now, 8);
    const reviewed = subHours(now, 6);
    const c: Complaint = {
      id: "cmp_review",
      ticket_id: "CR-2026-0002",
      student_id: "user_student",
      category: "internet",
      hostel_location: "Block B, Room 118",
      description: "Wi-Fi drops every few minutes in the study corner.",
      urgency: "medium",
      status: "under_review",
      priority: 3,
      assigned_worker_id: null,
      response_deadline: null,
      resolution_deadline: null,
      is_escalated: false,
      escalation_reason: null,
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(reviewed),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_warden", "warden", "submitted", "under_review", "Reviewed by warden", reviewed);
  }

  // 3. High assigned to Kumar
  {
    const created = subHours(now, 10);
    const assigned = subHours(now, 8);
    const d = deadlinesFromUrgency("high", assigned);
    const c: Complaint = {
      id: "cmp_assigned",
      ticket_id: "CR-2026-0003",
      student_id: "user_student",
      category: "electrical",
      hostel_location: "Block B, Room 312",
      description: "Room light flickering; risk of short circuit.",
      urgency: "high",
      status: "assigned",
      priority: 2,
      assigned_worker_id: "user_worker",
      response_deadline: d.response_deadline,
      resolution_deadline: d.resolution_deadline,
      is_escalated: false,
      escalation_reason: null,
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(assigned),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_warden", "warden", "submitted", "under_review", "Reviewed", subHours(now, 9));
    pushEvent(c.id, "user_warden", "warden", "under_review", "assigned", "Assigned to Kumar Technician", assigned);
  }

  // 4. In Progress
  {
    const created = subHours(now, 20);
    const assigned = subHours(now, 16);
    const started = subHours(now, 12);
    const d = deadlinesFromUrgency("medium", assigned);
    const c: Complaint = {
      id: "cmp_progress",
      ticket_id: "CR-2026-0004",
      student_id: "user_student",
      category: "water_supply",
      hostel_location: "Block B, Floor 2 washroom",
      description: "No water supply in common washroom since morning.",
      urgency: "medium",
      status: "in_progress",
      priority: 3,
      assigned_worker_id: "user_worker",
      response_deadline: d.response_deadline,
      resolution_deadline: d.resolution_deadline,
      is_escalated: false,
      escalation_reason: null,
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(started),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_warden", "warden", "under_review", "assigned", "Assigned to Kumar Technician", assigned);
    pushEvent(c.id, "user_worker", "worker", "assigned", "in_progress", "Worker accepted and started work", started);
  }

  // 5. Resolved awaiting verification
  {
    const created = subHours(now, 30);
    const assigned = subHours(now, 26);
    const resolved = subHours(now, 2);
    const d = deadlinesFromUrgency("low", assigned);
    const c: Complaint = {
      id: "cmp_resolved",
      ticket_id: "CR-2026-0005",
      student_id: "user_student",
      category: "room_maintenance",
      hostel_location: "Block B, Room 204",
      description: "Wardrobe door hinge broken.",
      urgency: "low",
      status: "resolved",
      priority: 4,
      assigned_worker_id: "user_worker2",
      response_deadline: d.response_deadline,
      resolution_deadline: d.resolution_deadline,
      is_escalated: false,
      escalation_reason: null,
      resolution_notes: "Replaced hinge and aligned door.",
      created_at: iso(created),
      updated_at: iso(resolved),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_warden", "warden", "under_review", "assigned", "Assigned to Priya Electrician", assigned);
    pushEvent(c.id, "user_worker2", "worker", "assigned", "in_progress", "Started work", subHours(now, 20));
    pushEvent(c.id, "user_worker2", "worker", "in_progress", "resolved", "Work completed by worker", resolved);
  }

  // 6. Rejected and reopened (escalated)
  {
    const created = subHours(now, 48);
    const resolved = subHours(now, 20);
    const rejected = subHours(now, 18);
    const c: Complaint = {
      id: "cmp_rejected",
      ticket_id: "CR-2026-0006",
      student_id: "user_student",
      category: "sanitation",
      hostel_location: "Block B, Ground floor corridor",
      description: "Persistent foul smell near garbage chute.",
      urgency: "high",
      status: "under_review",
      priority: 2,
      assigned_worker_id: null,
      response_deadline: null,
      resolution_deadline: null,
      is_escalated: true,
      escalation_reason: "Student rejected inadequate resolution",
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(rejected),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_worker", "worker", "in_progress", "resolved", "Claimed cleaned area", resolved);
    pushEvent(
      c.id,
      "user_student",
      "student",
      "resolved",
      "under_review",
      "Rejected: smell still present after cleaning",
      rejected,
    );
    escalations.push({
      id: uid("esc"),
      complaint_id: c.id,
      reason: "Student rejected inadequate resolution",
      recipient_role: "admin",
      timestamp: iso(rejected),
      status_at_escalation: "under_review",
      deadline_exceeded: null,
      reviewed: false,
    });
  }

  // 7. Overdue and escalated
  {
    const created = subHours(now, 72);
    const assigned = subHours(now, 60);
    const c: Complaint = {
      id: "cmp_overdue",
      ticket_id: "CR-2026-0007",
      student_id: "user_student",
      category: "mess",
      hostel_location: "Block B Mess hall",
      description: "Broken serving counter edge — injury risk.",
      urgency: "high",
      status: "in_progress",
      priority: 2,
      assigned_worker_id: "user_worker",
      response_deadline: iso(subHours(now, 50)),
      resolution_deadline: iso(subHours(now, 5)),
      is_escalated: true,
      escalation_reason: "Resolution deadline exceeded without completion",
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(subHours(now, 40)),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_warden", "warden", "under_review", "assigned", "Assigned to Kumar Technician", assigned);
    pushEvent(c.id, "user_worker", "worker", "assigned", "in_progress", "Started work", subHours(now, 40));
    pushEvent(
      c.id,
      "system",
      "system",
      "in_progress",
      "in_progress",
      "Escalated: Resolution deadline exceeded without completion",
      subHours(now, 4),
    );
    escalations.push({
      id: uid("esc"),
      complaint_id: c.id,
      reason: "Resolution deadline exceeded without completion",
      recipient_role: "admin",
      timestamp: iso(subHours(now, 4)),
      status_at_escalation: "in_progress",
      deadline_exceeded: c.resolution_deadline,
      reviewed: false,
    });
  }

  // 8. Emergency safety
  {
    const created = subMinutes(now, 40);
    const c: Complaint = {
      id: "cmp_emergency",
      ticket_id: "CR-2026-0008",
      student_id: "user_student",
      category: "safety",
      hostel_location: "Block B, Stairwell B2",
      description: "Exposed live wire near staircase railing — immediate hazard.",
      urgency: "emergency",
      status: "submitted",
      priority: 1,
      assigned_worker_id: null,
      response_deadline: null,
      resolution_deadline: null,
      is_escalated: true,
      escalation_reason: "Emergency / safety priority flag",
      resolution_notes: null,
      created_at: iso(created),
      updated_at: iso(created),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(
      c.id,
      "system",
      "system",
      "submitted",
      "submitted",
      "Escalated: Emergency / safety priority flag",
      created,
    );
    escalations.push({
      id: uid("esc"),
      complaint_id: c.id,
      reason: "Emergency / safety priority flag",
      recipient_role: "admin",
      timestamp: iso(created),
      status_at_escalation: "submitted",
      deadline_exceeded: null,
      reviewed: false,
    });
  }

  // 9. Closed with full history
  {
    const created = subHours(now, 96);
    const closed = subHours(now, 24);
    const d = deadlinesFromUrgency("medium", subHours(now, 90));
    const c: Complaint = {
      id: "cmp_closed",
      ticket_id: "CR-2026-0009",
      student_id: "user_student",
      category: "common_facilities",
      hostel_location: "Block B, Lift lobby",
      description: "Lift call button stuck on ground floor.",
      urgency: "medium",
      status: "closed",
      priority: 3,
      assigned_worker_id: "user_worker2",
      response_deadline: d.response_deadline,
      resolution_deadline: d.resolution_deadline,
      is_escalated: false,
      escalation_reason: null,
      resolution_notes: "Button mechanism replaced and tested.",
      created_at: iso(created),
      updated_at: iso(closed),
    };
    complaints.push(c);
    pushEvent(c.id, "user_student", "student", null, "submitted", "Complaint registered", created);
    pushEvent(c.id, "user_warden", "warden", "submitted", "under_review", "Reviewed", subHours(now, 94));
    pushEvent(c.id, "user_warden", "warden", "under_review", "assigned", "Assigned to Priya", subHours(now, 90));
    pushEvent(c.id, "user_worker2", "worker", "assigned", "in_progress", "Started", subHours(now, 80));
    pushEvent(c.id, "user_worker2", "worker", "in_progress", "resolved", "Resolved with notes", subHours(now, 30));
    pushEvent(c.id, "user_student", "student", "resolved", "closed", "Student accepted resolution", closed);
  }

  return {
    seed_version: SEED_VERSION,
    profiles,
    complaints,
    events,
    attachments: [],
    escalations,
    ticket_counter: 9,
  };
}

// silence unused import if tree-shaken oddly
void priorityFromUrgency;
