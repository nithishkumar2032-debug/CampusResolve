"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplaintAction } from "@/lib/actions";
import { CATEGORIES, MAX_UPLOAD_BYTES, URGENCIES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

export function NewComplaintForm({ user }: { user: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("");
  const [suggestNote, setSuggestNote] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const canSuggest = description.trim().length >= 20;

  async function suggest() {
    if (!canSuggest) return;
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

  function onFile(file: File | null) {
    setPreview(null);
    setFileName(null);
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image must be 5 MB or smaller");
      return;
    }
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  const urgencyOptions = useMemo(() => URGENCIES, []);

  return (
    <AppShell
      user={user}
      title="Submit New Complaint"
      subtitle="Describe the issue clearly so staff can respond quickly."
    >
      <div className="cr-card mx-auto max-w-3xl p-6">
        <form
          encType="multipart/form-data"
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
            <Label htmlFor="hostel_location">Hostel block and room / location</Label>
            <Input
              id="hostel_location"
              name="hostel_location"
              placeholder="Block B, Room 204"
              defaultValue={user.hostel_block ? `${user.hostel_block}, Room ` : ""}
              required
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Problem description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is broken, where exactly, since when, and impact."
              className="min-h-28 rounded-lg"
              required
              aria-describedby={suggestNote ? "suggest-note" : undefined}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void suggest()}
              disabled={suggesting || !canSuggest}
              className="rounded-lg"
            >
              {suggesting ? "Suggesting…" : "AI suggest category & urgency"}
            </Button>
            {suggestNote ? (
              <p id="suggest-note" className="text-xs text-on-surface-variant">
                {suggestNote}
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Enter at least 20 characters to enable AI suggestions (optional).
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select category</option>
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
                onChange={(e) => setUrgency(e.target.value)}
                required
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select urgency</option>
                {urgencyOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence_file">Photographic evidence (optional)</Label>
            <label
              htmlFor="evidence_file"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-muted/40 px-4 py-8 text-center transition hover:border-royal",
              )}
            >
              <Upload className="mb-2 h-6 w-6 text-royal" />
              <span className="text-sm font-medium text-navy">
                {fileName ?? "Click to upload JPEG, PNG, or WebP (max 5 MB)"}
              </span>
              <Input
                id="evidence_file"
                name="evidence_file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Evidence preview"
                className="mt-2 max-h-48 rounded-lg border border-outline-variant object-contain"
              />
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-lg bg-navy hover:bg-navy-deep"
              disabled={pending}
            >
              {pending ? "Submitting…" : "Submit request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
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
