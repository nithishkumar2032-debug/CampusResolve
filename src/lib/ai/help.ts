import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { FAQ_FALLBACK } from "../constants";
import type { ComplaintCategory, Urgency, UserRole } from "../types";

const SYSTEM_KNOWLEDGE = `You are CampusResolve Help Assistant for a college hostel complaint system.
Roles: student, warden, worker, admin.
Statuses: Submitted → Under Review → Assigned → In Progress → Resolved → Closed.
Routes: /student, /student/new, /student/tickets/[id], /warden, /worker, /admin.
Students submit tickets with category, location, description, urgency, optional photo.
Wardens review and assign workers with deadlines from urgency.
Workers accept, update progress, resolve with evidence.
Students accept or reject resolution; reject reopens and escalates.
Escalation: missed deadlines, rejected resolution, emergency/safety.
Help with navigation, explaining statuses, and drafting clear/formal complaint wording.
Never claim you changed ticket status. Never invent ticket IDs.
Keep answers concise (under 180 words) and actionable.`;

export function faqFallbackAnswer(question: string, role?: UserRole): string {
  const q = question.toLowerCase();
  const matches = FAQ_FALLBACK.filter((item) => {
    if (item.roles && role && !item.roles.includes(role)) return false;
    const hay = `${item.q} ${item.a}`.toLowerCase();
    return q.split(/\s+/).some((w) => w.length > 3 && hay.includes(w));
  });
  if (matches[0]) return matches[0].a;
  return (
    "I can help with navigation, statuses, and drafting complaints. " +
    "Try asking: “How do I submit a complaint?”, “What does Resolved mean?”, " +
    "or “Help me write a formal complaint about a leak.” " +
    "(AI is offline — showing built-in guidance.)"
  );
}

export async function askHelpAssistant(input: {
  message: string;
  role?: UserRole;
  page?: string;
}): Promise<{ answer: string; source: "ai" | "faq" }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { answer: faqFallbackAnswer(input.message, input.role), source: "faq" };
  }
  try {
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.3,
      apiKey,
    });
    const res = await model.invoke([
      new SystemMessage(SYSTEM_KNOWLEDGE),
      new HumanMessage(
        `User role: ${input.role ?? "unknown"}\nCurrent page: ${input.page ?? "unknown"}\nQuestion: ${input.message}`,
      ),
    ]);
    const text = typeof res.content === "string" ? res.content : String(res.content);
    return { answer: text, source: "ai" };
  } catch {
    return { answer: faqFallbackAnswer(input.message, input.role), source: "faq" };
  }
}

export async function suggestCategoryUrgency(description: string): Promise<{
  category: ComplaintCategory;
  urgency: Urgency;
  rationale: string;
  source: "ai" | "heuristic";
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  const heuristic = heuristicSuggest(description);
  if (!apiKey) return { ...heuristic, source: "heuristic" };
  try {
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
      apiKey,
    });
    const res = await model.invoke([
      new SystemMessage(
        `Suggest complaint category and urgency as JSON only: {"category":"...","urgency":"...","rationale":"..."}.
Categories: electrical,plumbing,water_supply,internet,room_maintenance,sanitation,mess,common_facilities,safety,other.
Urgency: low,medium,high,emergency.`,
      ),
      new HumanMessage(description),
    ]);
    const text = typeof res.content === "string" ? res.content : String(res.content);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { ...heuristic, source: "heuristic" };
    const parsed = JSON.parse(match[0]) as {
      category: ComplaintCategory;
      urgency: Urgency;
      rationale: string;
    };
    return { ...parsed, source: "ai" };
  } catch {
    return { ...heuristic, source: "heuristic" };
  }
}

function heuristicSuggest(description: string): {
  category: ComplaintCategory;
  urgency: Urgency;
  rationale: string;
} {
  const d = description.toLowerCase();
  let category: ComplaintCategory = "other";
  if (/electric|light|fan|socket|power|wiring/.test(d)) category = "electrical";
  else if (/plumb|tap|pipe|leak|drain|toilet/.test(d)) category = "plumbing";
  else if (/water|tank|supply/.test(d)) category = "water_supply";
  else if (/wifi|internet|network|lan/.test(d)) category = "internet";
  else if (/door|window|bed|furniture|wall|paint/.test(d)) category = "room_maintenance";
  else if (/clean|garbage|hygiene|sanit/.test(d)) category = "sanitation";
  else if (/mess|food|dining|canteen/.test(d)) category = "mess";
  else if (/lift|corridor|common|gym/.test(d)) category = "common_facilities";
  else if (/fire|theft|security|danger|safety|assault/.test(d)) category = "safety";

  let urgency: Urgency = "medium";
  if (/emergency|urgent|fire|flood|danger|smoke|gas|injury/.test(d)) urgency = "emergency";
  else if (/no water|no power|cannot|blocked|severe/.test(d)) urgency = "high";
  else if (/minor|small|occasionally/.test(d)) urgency = "low";

  return {
    category,
    urgency,
    rationale: "Suggested from keywords in your description (AI key not required).",
  };
}
