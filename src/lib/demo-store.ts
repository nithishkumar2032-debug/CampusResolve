import { promises as fs } from "fs";
import path from "path";
import { SEED_VERSION } from "./constants";
import {
  deadlinesFromUrgency,
  isOverdue,
  priorityFromUrgency,
} from "./complaints/deadlines";
import { assertTransition, sanitizeText } from "./complaints/transitions";
import { formatTicketId } from "./complaints/ticket-id";
import { buildSeedStore } from "./seed";
import type {
  AppStore,
  Attachment,
  Complaint,
  ComplaintCategory,
  ComplaintEvent,
  ComplaintStatus,
  EscalationRecord,
  Profile,
  Urgency,
  UserRole,
} from "./types";

const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "campusresolve-data")
    : path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let memoryCache: AppStore | null = null;

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

async function ensureStore(): Promise<AppStore> {
  if (memoryCache && memoryCache.seed_version === SEED_VERSION) {
    return memoryCache;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AppStore;
    if (parsed.seed_version !== SEED_VERSION) {
      const seeded = buildSeedStore();
      memoryCache = seeded;
      await saveStore(seeded);
      return seeded;
    }
    parsed.escalations = parsed.escalations ?? [];
    memoryCache = parsed;
    return parsed;
  } catch {
    const seeded = buildSeedStore();
    memoryCache = seeded;
    try {
      await fs.writeFile(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    } catch {
      /* memory only */
    }
    return seeded;
  }
}

async function saveStore(store: AppStore): Promise<void> {
  memoryCache = store;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    /* keep memory */
  }
}

function recordEscalation(
  store: AppStore,
  complaint: Complaint,
  reason: string,
  deadline_exceeded: string | null = null,
) {
  const esc: EscalationRecord = {
    id: uid("esc"),
    complaint_id: complaint.id,
    reason,
    recipient_role: "admin",
    timestamp: new Date().toISOString(),
    status_at_escalation: complaint.status,
    deadline_exceeded,
    reviewed: false,
  };
  store.escalations.push(esc);
  complaint.is_escalated = true;
  complaint.escalation_reason = reason;
}

function applyEscalationFlags(store: AppStore): AppStore {
  const now = new Date();
  for (const c of store.complaints) {
    if (c.status === "closed" || c.status === "resolved") continue;

    const missedResponse =
      ["submitted", "under_review"].includes(c.status) &&
      isOverdue(c.response_deadline, now);
    const missedResolution =
      ["assigned", "in_progress"].includes(c.status) &&
      isOverdue(c.resolution_deadline, now);

    if ((missedResponse || missedResolution) && !c.is_escalated) {
      const reason = missedResponse
        ? "Response deadline exceeded without assignment"
        : "Resolution deadline exceeded without completion";
      recordEscalation(
        store,
        c,
        reason,
        missedResponse ? c.response_deadline : c.resolution_deadline,
      );
      c.updated_at = now.toISOString();
      store.events.push({
        id: uid("evt"),
        complaint_id: c.id,
        actor_id: "system",
        actor_role: "system",
        from_status: c.status,
        to_status: c.status,
        note: `Escalated: ${reason}`,
        created_at: now.toISOString(),
      });
    }

    if (c.urgency === "emergency" && !c.is_escalated) {
      recordEscalation(store, c, "Emergency / safety priority flag");
    }
  }
  return store;
}

export async function getStore(): Promise<AppStore> {
  const store = applyEscalationFlags(await ensureStore());
  await saveStore(store);
  return store;
}

export async function findProfileByEmail(email: string): Promise<Profile | undefined> {
  const store = await getStore();
  return store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
}

export async function findProfileById(id: string): Promise<Profile | undefined> {
  const store = await getStore();
  return store.profiles.find((p) => p.id === id);
}

export async function listWorkers(): Promise<Profile[]> {
  const store = await getStore();
  return store.profiles.filter((p) => p.role === "worker");
}

export async function createProfile(input: {
  email: string;
  full_name: string;
  role: UserRole;
  hostel_block?: string;
  password: string;
}): Promise<Profile> {
  const store = await getStore();
  if (store.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Email already registered");
  }
  const profile: Profile = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    full_name: sanitizeText(input.full_name, 120),
    role: input.role,
    hostel_block: input.hostel_block ? sanitizeText(input.hostel_block, 80) : null,
    password: input.password,
    created_at: new Date().toISOString(),
  };
  store.profiles.push(profile);
  await saveStore(store);
  return profile;
}

export async function listComplaintsForUser(profile: Profile): Promise<Complaint[]> {
  const store = await getStore();
  let list = store.complaints;
  if (profile.role === "student") {
    list = list.filter((c) => c.student_id === profile.id);
  } else if (profile.role === "worker") {
    list = list.filter((c) => c.assigned_worker_id === profile.id);
  } else if (profile.role === "admin") {
    list = list.filter((c) => c.is_escalated || c.urgency === "emergency");
  }
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAllComplaints(): Promise<Complaint[]> {
  const store = await getStore();
  return [...store.complaints].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getComplaint(id: string): Promise<Complaint | undefined> {
  const store = await getStore();
  return store.complaints.find((c) => c.id === id || c.ticket_id === id);
}

export async function getEvents(complaintId: string): Promise<ComplaintEvent[]> {
  const store = await getStore();
  return store.events
    .filter((e) => e.complaint_id === complaintId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getAttachments(complaintId: string): Promise<Attachment[]> {
  const store = await getStore();
  return store.attachments.filter((a) => a.complaint_id === complaintId);
}

export async function getEscalations(complaintId?: string): Promise<EscalationRecord[]> {
  const store = await getStore();
  const list = complaintId
    ? store.escalations.filter((e) => e.complaint_id === complaintId)
    : store.escalations;
  return [...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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
  const store = await getStore();
  const year = new Date().getFullYear();
  store.ticket_counter += 1;
  const now = new Date().toISOString();
  const emergency = input.urgency === "emergency" || input.category === "safety";
  const complaint: Complaint = {
    id: uid("cmp"),
    ticket_id: formatTicketId(year, store.ticket_counter),
    student_id: input.student_id,
    category: input.category,
    hostel_location: sanitizeText(input.hostel_location, 200),
    description: sanitizeText(input.description, 4000),
    urgency: input.urgency,
    status: "submitted",
    priority: priorityFromUrgency(input.urgency),
    assigned_worker_id: null,
    response_deadline: null,
    resolution_deadline: null,
    is_escalated: emergency,
    escalation_reason: emergency ? "Emergency / safety priority flag" : null,
    resolution_notes: null,
    created_at: now,
    updated_at: now,
  };
  store.complaints.push(complaint);
  store.events.push({
    id: uid("evt"),
    complaint_id: complaint.id,
    actor_id: input.student_id,
    actor_role: "student",
    from_status: null,
    to_status: "submitted",
    note: "Complaint registered",
    created_at: now,
  });
  if (emergency) {
    recordEscalation(store, complaint, "Emergency / safety priority flag");
  }
  if (input.evidence_path) {
    store.attachments.push({
      id: uid("att"),
      complaint_id: complaint.id,
      uploaded_by: input.student_id,
      kind: "evidence",
      storage_path: input.evidence_path,
      mime_type: input.evidence_mime,
      created_at: now,
    });
  }
  await saveStore(store);
  return complaint;
}

async function transition(
  complaintId: string,
  actorId: string,
  actorRole: UserRole | "system",
  toStatus: ComplaintStatus,
  note: string,
  patch: Partial<Complaint> = {},
): Promise<Complaint> {
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  if (actorRole !== "system") {
    assertTransition(complaint.status, toStatus, actorRole);
  }
  const from = complaint.status;
  const now = new Date().toISOString();
  Object.assign(complaint, patch, { status: toStatus, updated_at: now });
  store.events.push({
    id: uid("evt"),
    complaint_id: complaint.id,
    actor_id: actorId,
    actor_role: actorRole,
    from_status: from,
    to_status: toStatus,
    note: sanitizeText(note, 1000),
    created_at: now,
  });
  await saveStore(store);
  return complaint;
}

export async function reviewComplaint(complaintId: string, actorId: string, note?: string) {
  return transition(
    complaintId,
    actorId,
    "warden",
    "under_review",
    note ?? "Reviewed by warden",
  );
}

export async function assignComplaint(
  complaintId: string,
  actorId: string,
  actorRole: UserRole,
  workerId: string,
  urgency?: Urgency,
) {
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  const u = urgency ?? complaint.urgency;
  const deadlines = deadlinesFromUrgency(u);
  const worker = store.profiles.find((p) => p.id === workerId);
  return transition(
    complaintId,
    actorId,
    actorRole,
    "assigned",
    `Assigned to ${worker?.full_name ?? "worker"}`,
    {
      assigned_worker_id: workerId,
      urgency: u,
      priority: priorityFromUrgency(u),
      response_deadline: deadlines.response_deadline,
      resolution_deadline: deadlines.resolution_deadline,
    },
  );
}

export async function acceptTask(complaintId: string, workerId: string) {
  return transition(
    complaintId,
    workerId,
    "worker",
    "in_progress",
    "Worker accepted and started work",
  );
}

export async function resolveComplaint(
  complaintId: string,
  workerId: string,
  notes: string,
  completionPath?: string,
  completionMime?: string,
) {
  const clean = sanitizeText(notes, 2000);
  if (!clean) throw new Error("Resolution notes are required");
  const complaint = await transition(
    complaintId,
    workerId,
    "worker",
    "resolved",
    "Work completed by worker",
    { resolution_notes: clean },
  );
  if (completionPath) {
    const store = await getStore();
    store.attachments.push({
      id: uid("att"),
      complaint_id: complaintId,
      uploaded_by: workerId,
      kind: "completion",
      storage_path: completionPath,
      mime_type: completionMime,
      created_at: new Date().toISOString(),
    });
    await saveStore(store);
  } else {
    // Flag insufficient completion evidence for staff visibility
    const store = await getStore();
    const c = store.complaints.find((x) => x.id === complaintId);
    if (c && !c.is_escalated) {
      // soft note only — not auto-escalate unless policy requires
      store.events.push({
        id: uid("evt"),
        complaint_id: complaintId,
        actor_id: "system",
        actor_role: "system",
        from_status: "resolved",
        to_status: "resolved",
        note: "Resolved without completion photo — student should verify carefully",
        created_at: new Date().toISOString(),
      });
      await saveStore(store);
    }
  }
  return complaint;
}

export async function verifyComplaint(
  complaintId: string,
  studentId: string,
  accepted: boolean,
  comment?: string,
) {
  if (accepted) {
    return transition(
      complaintId,
      studentId,
      "student",
      "closed",
      comment ? sanitizeText(comment) : "Student accepted resolution",
      { is_escalated: false },
    );
  }
  const reason = sanitizeText(comment ?? "", 1000);
  if (!reason) throw new Error("Rejection reason is required");
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  recordEscalation(store, complaint, `Student rejected: ${reason}`);
  await saveStore(store);
  return transition(
    complaintId,
    studentId,
    "student",
    "under_review",
    `Rejected: ${reason}`,
    {
      is_escalated: true,
      escalation_reason: `Student rejected: ${reason}`,
      assigned_worker_id: null,
      resolution_notes: null,
    },
  );
}

export async function addComment(complaintId: string, actorId: string, note: string) {
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  const actor = store.profiles.find((p) => p.id === actorId);
  store.events.push({
    id: uid("evt"),
    complaint_id: complaintId,
    actor_id: actorId,
    actor_role: actor?.role,
    from_status: complaint.status,
    to_status: complaint.status,
    note: sanitizeText(note, 1000),
    created_at: new Date().toISOString(),
  });
  await saveStore(store);
}

export async function saveUpload(file: {
  name: string;
  type: string;
  data: Buffer;
}): Promise<{ path: string; mime: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const filename = `${Date.now()}_${safe}`;
  const full = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(full, file.data);
  // Serve via API route
  return { path: `/api/uploads/${filename}`, mime: file.type };
}

export async function readUpload(filename: string): Promise<Buffer | null> {
  try {
    const safe = path.basename(filename);
    return await fs.readFile(path.join(UPLOAD_DIR, safe));
  } catch {
    return null;
  }
}

export async function getStats() {
  const store = await getStore();
  const total = store.complaints.length;
  const open = store.complaints.filter((c) => c.status !== "closed").length;
  const escalated = store.complaints.filter((c) => c.is_escalated).length;
  const overdue = store.complaints.filter(
    (c) =>
      c.status !== "closed" &&
      c.status !== "resolved" &&
      (isOverdue(c.response_deadline) || isOverdue(c.resolution_deadline)),
  ).length;
  const resolved = store.complaints.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const c of store.complaints) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }
  return { total, open, escalated, overdue, resolved, byCategory, byStatus };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}
