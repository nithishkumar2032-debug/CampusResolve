"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getSessionUser, requireUser, setSession } from "./auth";
import {
  ALLOWED_IMAGE_TYPES,
  CATEGORIES,
  MAX_UPLOAD_BYTES,
  ROLE_HOME,
  URGENCIES,
} from "./constants";
import {
  acceptTask,
  addComment,
  assignComplaint,
  createComplaint,
  createProfile,
  findProfileByEmail,
  resolveComplaint,
  reviewComplaint,
  saveUpload,
  verifyComplaint,
} from "./demo-store";
import { sanitizeText } from "./complaints/transitions";
import type { ComplaintCategory, Urgency, UserRole } from "./types";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const profile = await findProfileByEmail(email);
  if (!profile || profile.password !== password) {
    return { error: "Invalid email or password" };
  }
  await setSession(profile.id);
  redirect(ROLE_HOME[profile.role]);
}

/** Public signup — Student only */
export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const hostel_block = String(formData.get("hostel_block") ?? "").trim();
  if (!email || !password || !full_name) {
    return { error: "All fields are required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  try {
    const profile = await createProfile({
      email,
      password,
      full_name,
      role: "student",
      hostel_block: hostel_block || undefined,
    });
    await setSession(profile.id);
    redirect(ROLE_HOME[profile.role]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Signup failed" };
  }
}

/** Admin invites Warden or Worker accounts */
export async function createStaffAction(formData: FormData): Promise<void> {
  await requireUser(["admin"]);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;
  const hostel_block = String(formData.get("hostel_block") ?? "").trim();
  if (!email || !password || !full_name) return;
  if (role !== "warden" && role !== "worker") return;
  try {
    await createProfile({
      email,
      password,
      full_name,
      role,
      hostel_block: hostel_block || undefined,
    });
  } catch {
    return;
  }
  revalidatePath("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

async function processImageUpload(
  formData: FormData,
  field: string,
): Promise<{ path?: string; mime?: string; error?: string }> {
  const file = formData.get(field);
  if (!file || !(file instanceof File) || file.size === 0) {
    return {};
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { error: "Only JPEG, PNG, or WebP images are allowed" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image must be 5 MB or smaller" };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveUpload({ name: file.name, type: file.type, data: buf });
  return { path: saved.path, mime: saved.mime };
}

export async function createComplaintAction(formData: FormData) {
  const user = await requireUser(["student"]);
  const category = String(formData.get("category") ?? "") as ComplaintCategory;
  const hostel_location = String(formData.get("hostel_location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const urgency = String(formData.get("urgency") ?? "") as Urgency;

  if (!hostel_location || !description) {
    return { error: "Location and description are required" };
  }
  if (!CATEGORIES.some((c) => c.value === category)) {
    return { error: "Please select a category" };
  }
  if (!URGENCIES.some((u) => u.value === urgency)) {
    return { error: "Please select an urgency" };
  }

  const upload = await processImageUpload(formData, "evidence_file");
  if (upload.error) return { error: upload.error };

  const complaint = await createComplaint({
    student_id: user.id,
    category,
    hostel_location,
    description,
    urgency,
    evidence_path: upload.path,
    evidence_mime: upload.mime,
  });
  revalidatePath("/student");
  redirect(`/student/tickets/${complaint.id}`);
}

export async function reviewAction(complaintId: string) {
  const user = await requireUser(["warden", "admin"]);
  try {
    await reviewComplaint(complaintId, user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Review failed" };
  }
  revalidatePath("/warden");
  revalidatePath(`/warden/tickets/${complaintId}`);
}

export async function assignAction(formData: FormData): Promise<void> {
  const user = await requireUser(["warden", "admin"]);
  const complaintId = String(formData.get("complaint_id"));
  const workerId = String(formData.get("worker_id"));
  const urgencyRaw = String(formData.get("urgency") || "");
  const urgency = (urgencyRaw || undefined) as Urgency | undefined;
  try {
    await assignComplaint(complaintId, user.id, user.role, workerId, urgency);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Assignment failed");
  }
  revalidatePath("/warden");
  revalidatePath("/worker");
  revalidatePath("/admin");
  revalidatePath(`/warden/tickets/${complaintId}`);
  revalidatePath(`/admin/tickets/${complaintId}`);
}

export async function acceptAction(complaintId: string) {
  const user = await requireUser(["worker"]);
  try {
    await acceptTask(complaintId, user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accept failed" };
  }
  revalidatePath("/worker");
  revalidatePath(`/worker/tickets/${complaintId}`);
}

export async function resolveAction(formData: FormData): Promise<void> {
  const user = await requireUser(["worker"]);
  const complaintId = String(formData.get("complaint_id"));
  const notes = sanitizeText(String(formData.get("notes") ?? ""));
  if (!notes) return;
  const upload = await processImageUpload(formData, "completion_file");
  if (upload.error) return;
  await resolveComplaint(complaintId, user.id, notes, upload.path, upload.mime);
  revalidatePath("/worker");
  revalidatePath("/student");
  revalidatePath(`/worker/tickets/${complaintId}`);
}

export async function verifyAction(formData: FormData): Promise<void> {
  const user = await requireUser(["student"]);
  const complaintId = String(formData.get("complaint_id"));
  const decision = String(formData.get("decision"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (decision !== "accept" && !comment) {
    return; // rejection requires reason — UI enforces; server also throws
  }
  await verifyComplaint(complaintId, user.id, decision === "accept", comment || undefined);
  revalidatePath("/student");
  revalidatePath("/admin");
  revalidatePath(`/student/tickets/${complaintId}`);
}

export async function commentAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const complaintId = String(formData.get("complaint_id"));
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  await addComment(complaintId, user.id, note);
  revalidatePath(`/student/tickets/${complaintId}`);
  revalidatePath(`/warden/tickets/${complaintId}`);
  revalidatePath(`/worker/tickets/${complaintId}`);
  revalidatePath(`/admin/tickets/${complaintId}`);
}
