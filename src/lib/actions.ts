"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getSessionUser, requireUser, safeInternalPath } from "./auth";
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
  createSignedEvidenceUrl,
  resolveComplaint,
  reviewComplaint,
  uploadEvidenceFile,
  verifyComplaint,
} from "./data";
import { sanitizeText } from "./complaints/transitions";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { formatSupabaseAuthError, getSupabasePublicEnv } from "./supabase/env";
import type { ComplaintCategory, Urgency, UserRole } from "./types";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(String(formData.get("next") ?? ""), "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (!getSupabasePublicEnv()) {
    return {
      error:
        "Misconfigured Supabase: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel (Production), then redeploy.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: formatSupabaseAuthError(error) };
    }

    const role = (await getSessionUser())?.role;
    const dest = next || (role ? ROLE_HOME[role] : "/");
    redirect(dest || "/");
    void data;
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const message = err instanceof Error ? err.message : "Sign-in failed";
    return { error: formatSupabaseAuthError({ message }) };
  }
}

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

  if (!getSupabasePublicEnv()) {
    return {
      error:
        "Misconfigured Supabase: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel (Production), then redeploy.",
    };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || undefined;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        hostel_block: hostel_block || null,
        // role intentionally omitted — DB trigger forces student
      },
      emailRedirectTo: origin ? `${origin}/login` : undefined,
    },
  });
  if (error) return { error: formatSupabaseAuthError(error) };

  // If email confirmation is disabled, session exists and we can redirect
  const user = await getSessionUser();
  if (user) {
    redirect(ROLE_HOME.student);
  }
  return {
    success: true,
    message: "Account created. Check your email to verify, then sign in.",
  };
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required" };
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return { error: "App URL is not configured" };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true, message: "If that email exists, a reset link was sent." };
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "Password must be at least 6 characters" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/login");
}

/** Admin invites Warden or Worker via Auth Admin API */
export async function createStaffAction(formData: FormData) {
  const admin = await requireUser(["admin"]);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;
  const hostel_block = String(formData.get("hostel_block") ?? "").trim();

  if (!email || !password || !full_name) {
    return { error: "All fields are required" };
  }
  if (role !== "warden" && role !== "worker") {
    return { error: "Only Warden or Worker accounts can be invited" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const service = createAdminClient();
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, hostel_block: hostel_block || null },
    });
    if (createErr) {
      if (/already/i.test(createErr.message)) {
        return { error: "An account with this email already exists" };
      }
      return { error: createErr.message };
    }
    const userId = created.user?.id;
    if (!userId) return { error: "Could not create user" };

    // Trigger creates student profile — elevate role via service role
    const { error: profileErr } = await service
      .from("profiles")
      .update({
        role,
        full_name,
        hostel_block: hostel_block || null,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (profileErr) return { error: profileErr.message };

    await service.from("audit_log").insert({
      actor_id: admin.id,
      action: "staff_invite",
      target_email: email,
      meta: { role, full_name, hostel_block: hostel_block || null },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `${role === "warden" ? "Warden" : "Worker"} account created for ${email}`,
      user: { email, full_name, role },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create account" };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function processImageUpload(
  formData: FormData,
  field: string,
  complaintId: string,
  userId: string,
  kind: "evidence" | "completion",
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
  try {
    const saved = await uploadEvidenceFile({ complaintId, userId, file, kind });
    return { path: saved.path, mime: saved.mime };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
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

  // Create complaint first so storage path can include complaint id
  let complaint;
  try {
    complaint = await createComplaint({
      student_id: user.id,
      category,
      hostel_location,
      description,
      urgency,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create complaint" };
  }

  const upload = await processImageUpload(
    formData,
    "evidence_file",
    complaint.id,
    user.id,
    "evidence",
  );
  if (upload.error) {
    return { error: upload.error };
  }
  if (upload.path) {
    const supabase = await createClient();
    await supabase.from("attachments").insert({
      complaint_id: complaint.id,
      uploaded_by: user.id,
      kind: "evidence",
      storage_path: upload.path,
      mime_type: upload.mime ?? null,
    });
  }

  revalidatePath("/student");
  redirect(`/student/tickets/${complaint.id}`);
}

export async function reviewAction(complaintId: string) {
  await requireUser(["warden", "admin"]);
  try {
    await reviewComplaint(complaintId, "", undefined);
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
  const upload = await processImageUpload(
    formData,
    "completion_file",
    complaintId,
    user.id,
    "completion",
  );
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
  if (decision !== "accept" && !comment) return;
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

export async function getEvidenceUrlAction(storagePath: string) {
  await requireUser();
  try {
    return { url: await createSignedEvidenceUrl(storagePath) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load evidence" };
  }
}
