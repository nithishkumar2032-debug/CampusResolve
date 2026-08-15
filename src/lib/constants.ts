import type { ComplaintCategory, ComplaintStatus, Urgency, UserRole } from "./types";

export const APP_NAME = "CampusResolve";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "water_supply", label: "Water supply" },
  { value: "internet", label: "Internet / Wi‑Fi" },
  { value: "room_maintenance", label: "Room maintenance" },
  { value: "sanitation", label: "Sanitation" },
  { value: "mess", label: "Mess / dining" },
  { value: "common_facilities", label: "Common facilities" },
  { value: "safety", label: "Safety / security" },
  { value: "other", label: "Other" },
];

export const URGENCIES: { value: Urgency; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  warden: "/warden",
  worker: "/worker",
  admin: "/admin",
};

/** Centralized SLA matrix (minutes) — configurable demo defaults */
export const SLA_MINUTES: Record<Urgency, { response: number; resolution: number }> = {
  emergency: { response: 15, resolution: 120 },
  high: { response: 60, resolution: 480 },
  medium: { response: 240, resolution: 1440 },
  low: { response: 480, resolution: 4320 },
};

/** @deprecated use SLA_MINUTES — kept for any leftover imports */
export const DEADLINE_HOURS: Record<Urgency, { response: number; resolution: number }> = {
  emergency: { response: 0.25, resolution: 2 },
  high: { response: 1, resolution: 8 },
  medium: { response: 4, resolution: 24 },
  low: { response: 8, resolution: 72 },
};

export const FAQ_FALLBACK: { q: string; a: string; roles?: UserRole[] }[] = [
  {
    q: "How do I submit a complaint?",
    a: "Go to Student → New Request. Fill category, hostel location, description, urgency, and optionally attach a photo. You will get a unique ticket ID like CR-2026-0001.",
    roles: ["student"],
  },
  {
    q: "How do I track my ticket?",
    a: "Open Student dashboard and click a ticket. You will see the full status history and can add comments. When status is Resolved, accept or reject the fix.",
    roles: ["student"],
  },
  {
    q: "What do the statuses mean?",
    a: "Submitted → Under Review → Assigned → In Progress → Resolved → Closed. Resolved means the worker reported completion; Closed means you (or staff) verified the fix.",
  },
  {
    q: "How do I assign a worker?",
    a: "Open Warden queue, select a ticket, set priority if needed, choose a maintenance worker, and assign. Deadlines are set from urgency automatically.",
    roles: ["warden", "admin"],
  },
  {
    q: "How do I update work progress?",
    a: "Open Worker tasks, accept the assignment, mark In Progress, then Resolve with notes and optional completion photo.",
    roles: ["worker"],
  },
  {
    q: "When does escalation happen?",
    a: "If response or resolution deadlines are missed, if a student rejects a resolution, or for emergency/safety cases. Escalated tickets appear on the Admin dashboard.",
  },
  {
    q: "How should I write a clear complaint?",
    a: "Include: what is broken, exact location (block/room), when it started, and impact (e.g. no water in Block B Room 204 since morning). Keep it factual and specific.",
  },
];
