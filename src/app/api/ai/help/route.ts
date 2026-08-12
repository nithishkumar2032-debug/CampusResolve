import { NextResponse } from "next/server";
import { askHelpAssistant } from "@/lib/ai/help";
import type { UserRole } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    message?: string;
    role?: UserRole;
    page?: string;
  };
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  const result = await askHelpAssistant({
    message: body.message,
    role: body.role,
    page: body.page,
  });
  return NextResponse.json(result);
}
