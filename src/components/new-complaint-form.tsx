"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplaintAction } from "@/lib/actions";
import { CATEGORIES, URGENCIES } from "@/lib/constants";
import type { ComplaintCategory, Profile, Urgency } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NewComplaintForm({ user }: { user: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("plumbing");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [suggestNote, setSuggestNote] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  async function suggest() {
    if (!description.trim()) return;
    setSuggesting(true);
    setSuggestNote(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.category) setCategory(data.category);
      if (data.urgency) setUrgency(data.urgency);
      setSuggestNote(data.rationale ?? "Suggestion applied — you can change it before submit.");
    } catch {
      setSuggestNote("Could not fetch suggestion. Fill fields manually.");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <AppShell
      user={user}
      title="Submit New Complaint"
      subtitle="Describe the issue clearly so staff can respond quickly."
    >
      <div className="cr-card mx-auto max-w-3xl p-6">
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await createComplaintAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="hostel_location">Hostel location</Label>
            <Input
              id="hostel_location"
              name="hostel_location"
              placeholder="Block B, Room 204"
              defaultValue={user.hostel_block ? `${user.hostel_block}, Room ` : ""}
              required
              className="rounded"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is broken, where exactly, since when, and impact."
              className="min-h-28 rounded"
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void suggest()}
              disabled={suggesting || !description.trim()}
              className="rounded"
            >
              {suggesting ? "Suggesting…" : "AI suggest category & urgency"}
            </Button>
            {suggestNote ? <p className="text-xs text-on-surface-variant">{suggestNote}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="flex h-9 w-full rounded border border-input bg-transparent px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Urgency</Label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCIES.map((u) => (
                  <label
                    key={u.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm",
                      urgency === u.value
                        ? "border-royal bg-blue-50"
                        : "border-outline-variant",
                    )}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={u.value}
                      checked={urgency === u.value}
                      onChange={() => setUrgency(u.value)}
                      className="accent-royal"
                    />
                    {u.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence_path">Evidence photo URL (optional)</Label>
            <Input
              id="evidence_path"
              name="evidence_path"
              placeholder="https://... or storage path"
              className="rounded"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="rounded bg-navy hover:bg-navy-deep" disabled={pending}>
              {pending ? "Submitting…" : "Submit request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded"
              onClick={() => router.push("/student")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
