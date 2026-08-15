"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/lib/actions";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <main className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-royal">{APP_NAME}</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Choose a new password</h1>
        <form
          className="mt-6 space-y-4"
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await resetPasswordAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
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
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full rounded-lg bg-navy hover:bg-navy-deep">
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </main>
    </div>
  );
}
