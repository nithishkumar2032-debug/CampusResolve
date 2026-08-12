"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplaintAction } from "@/lib/actions";
import { CATEGORIES, URGENCIES } from "@/lib/constants";
import type { ComplaintCategory, Profile, Urgency } from "@/lib/types";

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
      title="New maintenance request"
      nav={[
        { href: "/student", label: "Dashboard" },
        { href: "/student/new", label: "New request" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complaint details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await createComplaintAction(fd);
                if (res?.error) setError(res.error);
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="hostel_location">Hostel location</Label>
              <Input
                id="hostel_location"
                name="hostel_location"
                placeholder="Block B, Room 204"
                defaultValue={user.hostel_block ? `${user.hostel_block}, Room ` : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue clearly: what, where, since when, impact."
                className="min-h-28"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void suggest()}
                disabled={suggesting || !description.trim()}
              >
                {suggesting ? "Suggesting…" : "AI suggest category & urgency"}
              </Button>
              {suggestNote ? <p className="text-xs text-slate-600">{suggestNote}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <select
                  id="urgency"
                  name="urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {URGENCIES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence_path">Evidence photo URL (optional)</Label>
              <Input
                id="evidence_path"
                name="evidence_path"
                placeholder="https://... or upload path after Supabase Storage is connected"
              />
              <p className="text-xs text-slate-500">
                Demo accepts a URL/path string. Connect Supabase Storage for real uploads.
              </p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" className="bg-teal-700 hover:bg-teal-600" disabled={pending}>
                {pending ? "Submitting…" : "Submit request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/student")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
