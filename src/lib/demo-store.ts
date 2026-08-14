import { promises as fs } from "fs";
import path from "path";
import { deadlinesFromUrgency, isOverdue, priorityFromUrgency } from "./complaints/deadlines";
import { formatTicketId } from "./complaints/ticket-id";
import type {
  AppStore,
  Attachment,
  Complaint,
  ComplaintCategory,
  ComplaintEvent,
  ComplaintStatus,
  Profile,
  Urgency,
  UserRole,
} from "./types";

const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "campusresolve-data")
    : path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

/** In-memory cache so warm serverless instances keep demo data briefly */
let memoryCache: AppStore | null = null;

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function seedStore(): AppStore {
  const now = new Date().toISOString();
  const profiles: Profile[] = [
    {
      id: "user_student",
      email: "student@demo.edu",
      full_name: "Asha Student",
      role: "student",
      hostel_block: "Block B",
      password: "demo1234",
      created_at: now,
    },
    {
      id: "user_warden",
      email: "warden@demo.edu",
      full_name: "Ravi Warden",
      role: "warden",
      hostel_block: "Block B",
      password: "demo1234",
      created_at: now,
    },
    {
      id: "user_worker",
      email: "worker@demo.edu",
      full_name: "Kumar Technician",
      role: "worker",
      hostel_block: null,
      password: "demo1234",
      created_at: now,
    },
    {
      id: "user_worker2",
      email: "worker2@demo.edu",
      full_name: "Priya Electrician",
      role: "worker",
      hostel_block: null,
      password: "demo1234",
      created_at: now,
    },
    {
      id: "user_admin",
      email: "admin@demo.edu",
      full_name: "Dean Admin",
      role: "admin",
      hostel_block: null,
      password: "demo1234",
      created_at: now,
    },
  ];

  const sample: Complaint = {
    id: "cmp_sample",
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
    created_at: now,
    updated_at: now,
  };

  const events: ComplaintEvent[] = [
    {
      id: "evt_sample",
      complaint_id: sample.id,
      actor_id: "user_student",
      from_status: null,
      to_status: "submitted",
      note: "Complaint registered",
      created_at: now,
    },
  ];

  return {
    profiles,
    complaints: [sample],
    events,
    attachments: [],
    ticket_counter: 1,
  };
}

async function ensureStore(): Promise<AppStore> {
  if (memoryCache) {
    return memoryCache;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    memoryCache = JSON.parse(raw) as AppStore;
    return memoryCache;
  } catch {
    const seeded = seedStore();
    memoryCache = seeded;
    try {
      await fs.writeFile(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    } catch {
      /* /tmp may be unavailable in some runtimes; memory still works */
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
    /* keep memory cache even if disk write fails on serverless */
  }
}

function applyEscalationFlags(store: AppStore): AppStore {
  const now = new Date();
  let changed = false;
  for (const c of store.complaints) {
    if (c.status === "closed" || c.status === "resolved") continue;
    const missedResponse =
      ["submitted", "under_review"].includes(c.status) &&
      isOverdue(c.response_deadline, now);
    const missedResolution =
      ["assigned", "in_progress"].includes(c.status) &&
      isOverdue(c.resolution_deadline, now);
    if ((missedResponse || missedResolution) && !c.is_escalated) {
      c.is_escalated = true;
      c.escalation_reason = missedResponse
        ? "Response deadline exceeded without assignment"
        : "Resolution deadline exceeded without completion";
      c.updated_at = now.toISOString();
      store.events.push({
        id: uid("evt"),
        complaint_id: c.id,
        actor_id: "system",
        from_status: c.status,
        to_status: c.status,
        note: `Escalated: ${c.escalation_reason}`,
        created_at: now.toISOString(),
      });
      changed = true;
    }
    if (c.urgency === "emergency" && !c.is_escalated) {
      c.is_escalated = true;
      c.escalation_reason = c.escalation_reason ?? "Emergency / safety priority flag";
      changed = true;
    }
  }
  if (changed) {
    // persisted by caller after mutation paths; here we mutate in-memory
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
    full_name: input.full_name,
    role: input.role,
    hostel_block: input.hostel_block ?? null,
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
  // warden (and any other staff) sees full queue
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

export async function createComplaint(input: {
  student_id: string;
  category: ComplaintCategory;
  hostel_location: string;
  description: string;
  urgency: Urgency;
  evidence_path?: string;
}): Promise<Complaint> {
  const store = await getStore();
  const year = new Date().getFullYear();
  store.ticket_counter += 1;
  const now = new Date().toISOString();
  const complaint: Complaint = {
    id: uid("cmp"),
    ticket_id: formatTicketId(year, store.ticket_counter),
    student_id: input.student_id,
    category: input.category,
    hostel_location: input.hostel_location,
    description: input.description,
    urgency: input.urgency,
    status: "submitted",
    priority: priorityFromUrgency(input.urgency),
    assigned_worker_id: null,
    response_deadline: null,
    resolution_deadline: null,
    is_escalated: input.urgency === "emergency" || input.category === "safety",
    escalation_reason:
      input.urgency === "emergency" || input.category === "safety"
        ? "Emergency / safety priority flag"
        : null,
    resolution_notes: null,
    created_at: now,
    updated_at: now,
  };
  store.complaints.push(complaint);
  store.events.push({
    id: uid("evt"),
    complaint_id: complaint.id,
    actor_id: input.student_id,
    from_status: null,
    to_status: "submitted",
    note: "Complaint registered",
    created_at: now,
  });
  if (input.evidence_path) {
    store.attachments.push({
      id: uid("att"),
      complaint_id: complaint.id,
      uploaded_by: input.student_id,
      kind: "evidence",
      storage_path: input.evidence_path,
      created_at: now,
    });
  }
  await saveStore(store);
  return complaint;
}

async function transition(
  complaintId: string,
  actorId: string,
  toStatus: ComplaintStatus,
  note: string,
  patch: Partial<Complaint> = {},
): Promise<Complaint> {
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  const from = complaint.status;
  const now = new Date().toISOString();
  Object.assign(complaint, patch, { status: toStatus, updated_at: now });
  store.events.push({
    id: uid("evt"),
    complaint_id: complaint.id,
    actor_id: actorId,
    from_status: from,
    to_status: toStatus,
    note,
    created_at: now,
  });
  await saveStore(store);
  return complaint;
}

export async function reviewComplaint(complaintId: string, actorId: string, note?: string) {
  return transition(complaintId, actorId, "under_review", note ?? "Reviewed by warden");
}

export async function assignComplaint(
  complaintId: string,
  actorId: string,
  workerId: string,
  urgency?: Urgency,
) {
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  const u = urgency ?? complaint.urgency;
  const deadlines = deadlinesFromUrgency(u);
  return transition(complaintId, actorId, "assigned", `Assigned to worker`, {
    assigned_worker_id: workerId,
    urgency: u,
    priority: priorityFromUrgency(u),
    response_deadline: deadlines.response_deadline,
    resolution_deadline: deadlines.resolution_deadline,
  });
}

export async function acceptTask(complaintId: string, workerId: string) {
  return transition(complaintId, workerId, "in_progress", "Worker accepted and started work");
}

export async function resolveComplaint(
  complaintId: string,
  workerId: string,
  notes: string,
  completionPath?: string,
) {
  const complaint = await transition(complaintId, workerId, "resolved", "Work completed by worker", {
    resolution_notes: notes,
  });
  if (completionPath) {
    const store = await getStore();
    store.attachments.push({
      id: uid("att"),
      complaint_id: complaintId,
      uploaded_by: workerId,
      kind: "completion",
      storage_path: completionPath,
      created_at: new Date().toISOString(),
    });
    await saveStore(store);
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
      "closed",
      comment ?? "Student accepted resolution",
      { is_escalated: false },
    );
  }
  return transition(
    complaintId,
    studentId,
    "under_review",
    comment ?? "Student rejected resolution — reopened",
    {
      is_escalated: true,
      escalation_reason: "Student rejected inadequate resolution",
      assigned_worker_id: null,
      resolution_notes: null,
    },
  );
}

export async function addComment(complaintId: string, actorId: string, note: string) {
  const store = await getStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error("Complaint not found");
  store.events.push({
    id: uid("evt"),
    complaint_id: complaintId,
    actor_id: actorId,
    from_status: complaint.status,
    to_status: complaint.status,
    note,
    created_at: new Date().toISOString(),
  });
  await saveStore(store);
}

export async function getStats() {
  const store = await getStore();
  const total = store.complaints.length;
  const open = store.complaints.filter((c) => c.status !== "closed").length;
  const escalated = store.complaints.filter((c) => c.is_escalated).length;
  const resolved = store.complaints.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;
  return { total, open, escalated, resolved };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
