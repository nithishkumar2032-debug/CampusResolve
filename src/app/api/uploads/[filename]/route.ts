import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSignedEvidenceUrl } from "@/lib/data";

/** Legacy path → signed Storage URL for authorized sessions */
export async function GET(
  _req: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await context.params;
  const objectPath = decodeURIComponent(filename);
  if (!objectPath || objectPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const url = await createSignedEvidenceUrl(objectPath);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
