"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signupAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Register as student, warden, or worker for the demo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await signupAction(fd);
                if (res?.error) setError(res.error);
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue="student"
              >
                <option value="student">Student</option>
                <option value="warden">Warden</option>
                <option value="worker">Maintenance worker</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostel_block">Hostel block (optional)</Label>
              <Input id="hostel_block" name="hostel_block" placeholder="Block B" />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-600" disabled={pending}>
              {pending ? "Creating…" : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-teal-700 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
