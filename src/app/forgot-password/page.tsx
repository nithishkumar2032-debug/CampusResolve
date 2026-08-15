"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { forgotPasswordAction } from "@/lib/actions";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <main className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-royal">{APP_NAME}</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Reset password</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Enter your account email and we will send a reset link.
        </p>
        <form
          className="mt-6 space-y-4"
          action={(fd) => {
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const res = await forgotPasswordAction(fd);
              if (res?.error) setError(res.error);
              else if (res?.message) setMessage(res.message);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="rounded-lg" />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-resolved" role="status">
              {message}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full rounded-lg bg-navy hover:bg-navy-deep">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="font-semibold text-royal hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
