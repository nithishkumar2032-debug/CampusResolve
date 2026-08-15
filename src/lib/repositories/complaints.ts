import { createClient } from "@/lib/supabase/server";
import type {
  Attachment,
  Complaint,
  ComplaintCategory,
  ComplaintEvent,
  EscalationRecord,
  Profile,
  Urgency,
  UserRole,
} from "@/lib/types";
import { deadlinesFromUrgency } from "@/lib/complaints/deadlines";
import { isOverdue } from "@/lib/complaints/deadlines";

function mapComplaint(row: Record<string, unknown>): Complaint {
  return {
    id: String(row.id),
    ticket_id: String(row.ticket_id),
    student_id: String(row.student_id),
    category: row.category as ComplaintCategory,
    hostel_location: String(row.hostel_location),
    description: String(row.description),
    urgency: row.urgency as Urgency,
    status: row.status as Complaint["status"],
    priority: Number(row.priority),
    assigned_worker_id: row.assigned_worker_id ? String(row.assigned_worker_id) : null,
    response_deadline: row.response_deadline ? String(row.response_deadline) : null,
    resolution_deadline: row.resolution_deadline ? String(row.resolution_deadline) : null,
    is_escalated: Boolean(row.is_escalated),
    escalation_reason: row.escalation_reason ? String(row.escalation_reason) : null,
    resolution_notes: row.resolution_notes ? String(row.resolution_notes) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    role: row.role as UserRole,
    hostel_block: row.hostel_block ? String(row.hostel_block) : null,
    active: row.active !== false,
    created_at: String(row.created_at),
    updated_at: row.updated_at ? String(row.updated_at) : String(row.created_at),
  };
}

function mapEvent(row: Record<string, unknown>): ComplaintEvent {
  return {
    id: String(row.id),
    complaint_id: String(row.complaint_id),
    actor_id: row.actor_id ? String(row.actor_id) : "",
    actor_role: (row.actor_role as ComplaintEvent["actor_role"]) ?? undefined,
    from_status: (row.from_status as ComplaintEvent["from_status"]) ?? null,
    to_status: (row.to_status as ComplaintEvent["to_status"]) ?? null,
    note: String(row.note),
    created_at: String(row.created_at),
  };
}

function mapAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: String(row.id),
    complaint_id: String(row.complaint_id),
    uploaded_by: String(row.uploaded_by),
    kind: row.kind as Attachment["kind"],
    storage_path: String(row.storage_path),
    mime_type: row.mime_type ? String(row.mime_type) : undefined,
    created_at: String(row.created_at),
  };
}

export async function findProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, hostel_block, active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  return data ? mapProfile(data) : null;
}

export async function listWorkers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, hostel_block, active, created_at, updated_at")
    .eq("role", "worker")
    .eq("active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

export async function listAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, hostel_block, active, created_at, updated_at")
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

export async function listComplaintsForUser(user: Profile): Promise<Complaint[]> {
  const supabase = await createClient();
  let query = supabase.from("complaints").select("*").order("updated_at", { ascending: false });

  if (user.role === "student") {
    query = query.eq("student_id", user.id);
  } else if (user.role === "worker") {
    query = query.eq("assigned_worker_id", user.id);
  } else if (user.role === "admin") {
    query = query.eq("is_escalated", true);
  }
  // warden: all visible via RLS

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapComplaint);
}

export async function listAllComplaints(): Promise<Complaint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapComplaint);
}

export async function getComplaint(id: string): Promise<Complaint | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select("*")
    .or(`id.eq.${id},ticket_id.eq.${id}`)
    .maybeSingle();
  return data ? mapComplaint(data) : undefined;
}

export async function getEvents(complaintId: string): Promise<ComplaintEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaint_events")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEvent);
}

export async function getAttachments(complaintId: string): Promise<Attachment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAttachment);
}

export async function getEscalations(complaintId?: string): Promise<EscalationRecord[]> {
  const supabase = await createClient();
  let query = supabase.from("escalations").select("*").order("created_at", { ascending: false });
  if (complaintId) query = query.eq("complaint_id", complaintId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    complaint_id: String(row.complaint_id),
    reason: String(row.reason),
    recipient_role: row.recipient_role as UserRole,
    timestamp: String(row.created_at),
    status_at_escalation: row.status_at_escalation as Complaint["status"],
    deadline_exceeded: row.deadline_exceeded ? String(row.deadline_exceeded) : null,
    reviewed: Boolean(row.reviewed),
  }));
}

/** Compatibility helper for pages that previously used getStore().profiles */
export async function getProfilesMap(): Promise<Profile[]> {
  return listAllProfiles();
}

export async function createComplaint(input: {
  student_id: string;
  category: ComplaintCategory;
  hostel_location: string;
  description: string;
  urgency: Urgency;
  evidence_path?: string;
  evidence_mime?: string;
}): Promise<Complaint> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_complaint", {
    p_category: input.category,
    p_hostel_location: input.hostel_location,
    p_description: input.description,
    p_urgency: input.urgency,
  });
  if (error) throw new Error(error.message);
  const complaint = mapComplaint(data as Record<string, unknown>);

  if (input.evidence_path) {
    const { error: attErr } = await supabase.from("attachments").insert({
      complaint_id: complaint.id,
      uploaded_by: input.student_id,
      kind: "evidence",
      storage_path: input.evidence_path,
      mime_type: input.evidence_mime ?? null,
    });
    if (attErr) throw new Error(attErr.message);
  }
  return complaint;
}

export async function reviewComplaint(complaintId: string, _actorId: string, note?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_complaint", {
    p_complaint_id: complaintId,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return mapComplaint(data as Record<string, unknown>);
}

export async function assignComplaint(
  complaintId: string,
  _actorId: string,
  _actorRole: UserRole,
  workerId: string,
  urgency?: Urgency,
) {
  const supabase = await createClient();
  const u = urgency;
  const deadlines = u ? deadlinesFromUrgency(u) : null;
  // If urgency not passed, still need deadlines from current complaint urgency
  let response = deadlines?.response_deadline ?? null;
  let resolution = deadlines?.resolution_deadline ?? null;
  if (!u) {
    const existing = await getComplaint(complaintId);
    if (existing) {
      const d = deadlinesFromUrgency(existing.urgency);
      response = d.response_deadline;
      resolution = d.resolution_deadline;
    }
  }
  const { data, error } = await supabase.rpc("assign_complaint", {
    p_complaint_id: complaintId,
    p_worker_id: workerId,
    p_urgency: urgency ?? null,
    p_response_deadline: response,
    p_resolution_deadline: resolution,
  });
  if (error) throw new Error(error.message);
  return mapComplaint(data as Record<string, unknown>);
}

export async function acceptTask(complaintId: string, _workerId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_task", {
    p_complaint_id: complaintId,
  });
  if (error) throw new Error(error.message);
  return mapComplaint(data as Record<string, unknown>);
}

export async function resolveComplaint(
  complaintId: string,
  workerId: string,
  notes: string,
  completionPath?: string,
  completionMime?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_complaint", {
    p_complaint_id: complaintId,
    p_notes: notes,
  });
  if (error) throw new Error(error.message);
  const complaint = mapComplaint(data as Record<string, unknown>);
  if (completionPath) {
    const { error: attErr } = await supabase.from("attachments").insert({
      complaint_id: complaintId,
      uploaded_by: workerId,
      kind: "completion",
      storage_path: completionPath,
      mime_type: completionMime ?? null,
    });
    if (attErr) throw new Error(attErr.message);
  }
  return complaint;
}

export async function verifyComplaint(
  complaintId: string,
  _studentId: string,
  accepted: boolean,
  comment?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_complaint", {
    p_complaint_id: complaintId,
    p_accepted: accepted,
    p_comment: comment ?? null,
  });
  if (error) throw new Error(error.message);
  return mapComplaint(data as Record<string, unknown>);
}

export async function addComment(complaintId: string, _actorId: string, note: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_complaint_comment", {
    p_complaint_id: complaintId,
    p_note: note,
  });
  if (error) throw new Error(error.message);
}

export async function getStats() {
  const complaints = await listAllComplaints();
  const total = complaints.length;
  const open = complaints.filter((c) => c.status !== "closed").length;
  const escalated = complaints.filter((c) => c.is_escalated).length;
  const overdue = complaints.filter(
    (c) =>
      c.status !== "closed" &&
      c.status !== "resolved" &&
      (isOverdue(c.response_deadline) || isOverdue(c.resolution_deadline)),
  ).length;
  const resolved = complaints.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const c of complaints) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }
  return { total, open, escalated, overdue, resolved, byCategory, byStatus };
}

export const EVIDENCE_BUCKET = "complaint-evidence";

export async function uploadEvidenceFile(opts: {
  complaintId: string;
  userId: string;
  file: File;
  kind: "evidence" | "completion";
}): Promise<{ path: string; mime: string }> {
  const supabase = await createClient();
  const ext =
    opts.file.type === "image/png"
      ? "png"
      : opts.file.type === "image/webp"
        ? "webp"
        : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const objectPath = `complaints/${opts.complaintId}/${opts.userId}/${filename}`;
  const buffer = Buffer.from(await opts.file.arrayBuffer());
  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: opts.file.type,
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return { path: objectPath, mime: opts.file.type };
}

export async function createSignedEvidenceUrl(storagePath: string, expiresIn = 3600) {
  const supabase = await createClient();
  // Support legacy /api/uploads paths during migration (none in production)
  if (storagePath.startsWith("/api/uploads/")) {
    return storagePath;
  }
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
