"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createStaffAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteStaffForm() {
  const [pending, startTransition] = useTransition();
  const [liveMessage, setLiveMessage] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLiveMessage("");
        startTransition(async () => {
          const res = await createStaffAction(fd);
          if (res?.error) {
            setLiveMessage(res.error);
            toast.error(res.error);
            return;
          }
          const msg = res?.message ?? "Staff account created";
          setLiveMessage(msg);
          toast.success(msg);
          e.currentTarget.reset();
        });
      }}
    >
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required className="rounded-lg" disabled={pending} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          required
          className="rounded-lg"
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="password">Temporary password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="rounded-lg"
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          defaultValue="worker"
          disabled={pending}
        >
          <option value="warden">Warden</option>
          <option value="worker">Worker</option>
        </select>
      </div>
      <div>
        <Label htmlFor="hostel_block">Hostel block (optional)</Label>
        <Input id="hostel_block" name="hostel_block" className="rounded-lg" disabled={pending} />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
      {liveMessage ? (
        <p className="text-sm text-on-surface-variant" aria-hidden="true">
          {liveMessage}
        </p>
      ) : null}
      <Button type="submit" className="rounded-lg bg-navy hover:bg-navy-deep" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
