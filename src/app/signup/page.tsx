"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signupAction } from "@/lib/actions";
import { APP_NAME, DEMO_MODE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-[0_10px_25px_rgba(0,0,0,0.08)] sm:p-8">
        <p className="text-sm font-semibold text-royal">{APP_NAME}</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Create student account</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Public registration is limited to students. Staff accounts are invited by Admin.
        </p>
        {DEMO_MODE ? (
          <p className="mt-3 rounded border border-royal/20 bg-blue-50 px-3 py-2 text-xs text-navy">
            Demo Mode enabled — use login demo shortcuts for staff roles.
          </p>
        ) : null}
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
            <Input id="full_name" name="full_name" autoComplete="name" required className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostel_block">Hostel block (optional)</Label>
            <Input
              id="hostel_block"
              name="hostel_block"
              placeholder="Block B"
              className="rounded-lg"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full rounded-lg bg-navy hover:bg-navy-deep"
            disabled={pending}
          >
            {pending ? "Creating…" : "Sign up as Student"}
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
