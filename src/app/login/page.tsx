"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const demos = [
  { email: "student@demo.edu", role: "Student" },
  { email: "warden@demo.edu", role: "Warden" },
  { email: "worker@demo.edu", role: "Worker" },
  { email: "admin@demo.edu", role: "Admin" },
];

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("student@demo.edu");
  const [password, setPassword] = useState("demo1234");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#99f6e4_0%,transparent_40%),radial-gradient(circle_at_80%_0%,#bae6fd_0%,transparent_35%),linear-gradient(160deg,#0f766e_0%,#0f172a_55%,#134e4a_100%)]" />
      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="text-teal-50">
          <p className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
            {APP_NAME}
          </p>
          <p className="mt-4 max-w-md text-lg text-teal-100/90">
            Transparent hostel maintenance — every request owned, tracked, and verified.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-teal-100/80">
            <li>Unique tickets with full activity history</li>
            <li>Warden assignment and worker updates</li>
            <li>Escalation flags for overdue and rejected cases</li>
          </ul>
        </div>
        <Card className="border-0 shadow-2xl shadow-black/30">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use a demo account or your registered credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const res = await loginAction(fd);
                  if (res?.error) setError(res.error);
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-600"
                disabled={pending}
              >
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Demo accounts (password: demo1234)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demos.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    className="rounded-md border border-slate-200 px-2 py-2 text-left text-xs hover:bg-slate-50"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("demo1234");
                    }}
                  >
                    <span className="font-semibold text-slate-800">{d.role}</span>
                    <br />
                    {d.email}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              New here?{" "}
              <Link href="/signup" className="font-medium text-teal-700 hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
