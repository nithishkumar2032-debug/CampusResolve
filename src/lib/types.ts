export type UserRole = "student" | "warden" | "worker" | "admin";

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export type Urgency = "low" | "medium" | "high" | "emergency";

export type ComplaintCategory =
  | "electrical"
  | "plumbing"
  | "water_supply"
  | "internet"
  | "room_maintenance"
  | "sanitation"
  | "mess"
  | "common_facilities"
  | "safety"
  | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hostel_block: string | null;
  password?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  ticket_id: string;
  student_id: string;
  category: ComplaintCategory;
  hostel_location: string;
  description: string;
  urgency: Urgency;
  status: ComplaintStatus;
  priority: number;
  assigned_worker_id: string | null;
  response_deadline: string | null;
  resolution_deadline: string | null;
  is_escalated: boolean;
  escalation_reason: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintEvent {
  id: string;
  complaint_id: string;
  actor_id: string;
  actor_role?: UserRole | "system";
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus | null;
  note: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  complaint_id: string;
  uploaded_by: string;
  kind: "evidence" | "completion";
  storage_path: string;
  mime_type?: string;
  created_at: string;
}

export interface EscalationRecord {
  id: string;
  complaint_id: string;
  reason: string;
  recipient_role: UserRole;
  timestamp: string;
  status_at_escalation: ComplaintStatus;
  deadline_exceeded: string | null;
  reviewed: boolean;
}

export interface AppStore {
  seed_version: number;
  profiles: Profile[];
  complaints: Complaint[];
  events: ComplaintEvent[];
  attachments: Attachment[];
  escalations: EscalationRecord[];
  ticket_counter: number;
}
