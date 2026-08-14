"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signupAction } from "@/lib/actions";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded border border-outline-variant bg-white p-6 shadow-[0_10px_25px_rgba(0,0,0,0.08)] sm:p-8">
        <p className="text-sm font-semibold text-royal">{APP_NAME}</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Create account</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Register as student, warden, or worker for the demo.
        </p>
        <form
          className="mt-6 space-y-4"
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await signupAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required className="rounded" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="rounded" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="rounded"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="flex h-9 w-full rounded border border-input bg-transparent px-3 text-sm"
              defaultValue="student"
            >
              <option value="student">Student</option>
              <option value="warden">Warden</option>
              <option value="worker">Maintenance worker</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostel_block">Hostel block (optional)</Label>
            <Input id="hostel_block" name="hostel_block" placeholder="Block B" className="rounded" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full rounded bg-navy hover:bg-navy-deep" disabled={pending}>
            {pending ? "Creating…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-royal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
