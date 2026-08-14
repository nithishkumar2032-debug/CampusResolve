/**
 * Lightweight transition-rule checks (no test runner required).
 * Run: npx tsx scripts/check-transitions.ts
 * Or: node --import tsx scripts/check-transitions.ts
 */
import { assertTransition, canTransition } from "../src/lib/complaints/transitions";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canTransition("submitted", "under_review", "warden"), "warden can review");
assert(!canTransition("submitted", "assigned", "warden"), "warden cannot skip to assigned");
assert(canTransition("submitted", "assigned", "admin"), "admin can assign from submitted");
assert(canTransition("assigned", "in_progress", "worker"), "worker can start");
assert(!canTransition("in_progress", "closed", "worker"), "worker cannot close");
assert(canTransition("resolved", "closed", "student"), "student can close");
assert(canTransition("resolved", "under_review", "student"), "student can reject/reopen");

try {
  assertTransition("resolved", "closed", "worker");
  throw new Error("expected worker close to fail");
} catch (e) {
  assert(e instanceof Error && e.message.includes("Invalid"), "rejects invalid transition");
}

console.log("OK: transition rules passed");
