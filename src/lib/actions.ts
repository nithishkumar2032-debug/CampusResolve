"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getSessionUser, requireUser, setSession } from "./auth";
import { ROLE_HOME } from "./constants";
import {
  acceptTask,
  addComment,
  assignComplaint,
  createComplaint,
  createProfile,
  findProfileByEmail,
  resolveComplaint,
  reviewComplaint,
  verifyComplaint,
} from "./demo-store";
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

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "student") as UserRole;
  const hostel_block = String(formData.get("hostel_block") ?? "").trim();
  if (!email || !password || !full_name) {
    return { error: "All fields are required" };
  }
  const allowed: UserRole[] = ["student", "warden", "worker"];
  if (!allowed.includes(role)) {
    return { error: "Invalid role" };
  }
  try {
    const profile = await createProfile({
      email,
      password,
      full_name,
      role,
      hostel_block: hostel_block || undefined,
    });
    await setSession(profile.id);
    redirect(ROLE_HOME[profile.role]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Signup failed" };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createComplaintAction(formData: FormData) {
  const user = await requireUser(["student"]);
  const category = String(formData.get("category")) as ComplaintCategory;
  const hostel_location = String(formData.get("hostel_location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const urgency = String(formData.get("urgency")) as Urgency;
  const evidence_path = String(formData.get("evidence_path") ?? "").trim() || undefined;
  if (!hostel_location || !description) {
    return { error: "Location and description are required" };
  }
  const complaint = await createComplaint({
    student_id: user.id,
    category,
    hostel_location,
    description,
    urgency,
    evidence_path,
  });
  revalidatePath("/student");
  redirect(`/student/tickets/${complaint.id}`);
}

export async function reviewAction(complaintId: string) {
  const user = await requireUser(["warden", "admin"]);
  await reviewComplaint(complaintId, user.id);
  revalidatePath("/warden");
  revalidatePath(`/warden/tickets/${complaintId}`);
}

export async function assignAction(formData: FormData) {
  const user = await requireUser(["warden", "admin"]);
  const complaintId = String(formData.get("complaint_id"));
  const workerId = String(formData.get("worker_id"));
  const urgency = String(formData.get("urgency") || "") as Urgency | "";
  await assignComplaint(complaintId, user.id, workerId, urgency || undefined);
  revalidatePath("/warden");
  revalidatePath("/worker");
  revalidatePath(`/warden/tickets/${complaintId}`);
}

export async function acceptAction(complaintId: string) {
  const user = await requireUser(["worker"]);
  await acceptTask(complaintId, user.id);
  revalidatePath("/worker");
  revalidatePath(`/worker/tickets/${complaintId}`);
}

export async function resolveAction(formData: FormData): Promise<void> {
  const user = await requireUser(["worker"]);
  const complaintId = String(formData.get("complaint_id"));
  const notes = String(formData.get("notes") ?? "").trim();
  const completion_path =
    String(formData.get("completion_path") ?? "").trim() || undefined;
  if (!notes) return;
  await resolveComplaint(complaintId, user.id, notes, completion_path);
  revalidatePath("/worker");
  revalidatePath("/student");
  revalidatePath(`/worker/tickets/${complaintId}`);
}

export async function verifyAction(formData: FormData): Promise<void> {
  const user = await requireUser(["student"]);
  const complaintId = String(formData.get("complaint_id"));
  const decision = String(formData.get("decision"));
  const comment = String(formData.get("comment") ?? "").trim() || undefined;
  await verifyComplaint(complaintId, user.id, decision === "accept", comment);
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
