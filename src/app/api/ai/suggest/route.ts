import { NextResponse } from "next/server";
import { suggestCategoryUrgency } from "@/lib/ai/help";

export async function POST(req: Request) {
  const body = (await req.json()) as { description?: string };
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }
  const result = await suggestCategoryUrgency(body.description);
  return NextResponse.json(result);
}
