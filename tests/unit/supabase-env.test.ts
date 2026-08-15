import { describe, expect, it } from "vitest";
import {
  formatSupabaseAuthError,
  normalizeSupabaseUrl,
} from "../../src/lib/supabase/env";

describe("normalizeSupabaseUrl", () => {
  it("accepts project API root", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co")).toEqual({
      url: "https://abc.supabase.co",
      host: "abc.supabase.co",
    });
  });

  it("strips wrapping quotes and whitespace", () => {
    expect(normalizeSupabaseUrl('  "https://abc.supabase.co/"  ')).toEqual({
      url: "https://abc.supabase.co",
      host: "abc.supabase.co",
    });
  });

  it("rejects /rest/v1 and other paths", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/rest/v1")).toBeNull();
    expect(normalizeSupabaseUrl("https://abc.supabase.co/auth/v1")).toBeNull();
  });

  it("rejects non-https and non-supabase hosts", () => {
    expect(normalizeSupabaseUrl("http://abc.supabase.co")).toBeNull();
    expect(normalizeSupabaseUrl("https://campus-resolve-six.vercel.app")).toBeNull();
  });
});

describe("formatSupabaseAuthError", () => {
  it("rewrites fetch failed", () => {
    const msg = formatSupabaseAuthError({ message: "fetch failed" });
    expect(msg.toLowerCase()).toContain("supabase");
    expect(msg.toLowerCase()).not.toBe("fetch failed");
  });
});
