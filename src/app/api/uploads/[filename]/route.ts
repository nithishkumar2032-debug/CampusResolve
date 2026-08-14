import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getComplaint, getStore, readUpload } from "@/lib/demo-store";

export async function GET(
  _req: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await context.params;
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== filename) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const storagePath = `/api/uploads/${safe}`;
  const store = await getStore();
  const attachment = store.attachments.find((a) => a.storage_path === storagePath);

  if (attachment) {
    const complaint = await getComplaint(attachment.complaint_id);
    if (!complaint) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const allowed =
      user.role === "admin" ||
      user.role === "warden" ||
      (user.role === "student" && complaint.student_id === user.id) ||
      (user.role === "worker" && complaint.assigned_worker_id === user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!["warden", "admin", "worker"].includes(user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await readUpload(safe);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const lower = safe.toLowerCase();
  const type = lower.endsWith(".png")
    ? "image/png"
    : lower.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
