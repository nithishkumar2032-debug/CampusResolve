import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, sanitizeText } from "@/lib/complaints/transitions";
import { deadlinesFromUrgency, formatSlaLabel } from "@/lib/complaints/deadlines";
import { safeInternalPath } from "@/lib/safe-path";

describe("status transitions", () => {
  it("allows the happy path", () => {
    expect(canTransition("submitted", "under_review", "warden")).toBe(true);
    expect(canTransition("under_review", "assigned", "warden")).toBe(true);
    expect(canTransition("assigned", "in_progress", "worker")).toBe(true);
    expect(canTransition("in_progress", "resolved", "worker")).toBe(true);
    expect(canTransition("resolved", "closed", "student")).toBe(true);
  });

  it("blocks worker from closing", () => {
    expect(canTransition("in_progress", "closed", "worker")).toBe(false);
    expect(() => assertTransition("resolved", "closed", "worker")).toThrow(/Invalid/);
  });

  it("requires student rejection reopen path", () => {
    expect(canTransition("resolved", "under_review", "student")).toBe(true);
  });
});

describe("SLA", () => {
  it("computes emergency minutes", () => {
    const d = deadlinesFromUrgency("emergency");
    expect(d.response_minutes).toBe(15);
    expect(d.resolution_minutes).toBe(120);
    expect(formatSlaLabel(15)).toContain("min");
  });
});

describe("sanitizeText", () => {
  it("strips tags", () => {
    expect(sanitizeText("<b>hello</b>")).toBe("hello");
  });
});

describe("safeInternalPath", () => {
  it("blocks open redirects", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("/student")).toBe("/student");
  });
});
