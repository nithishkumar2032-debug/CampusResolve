"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  GraduationCap,
  Lock,
  Mail,
  Shield,
  Wrench,
} from "lucide-react";
import { loginAction } from "@/lib/actions";
import { APP_NAME, DEMO_MODE } from "@/lib/constants";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const roles: {
  id: UserRole;
  label: string;
  blurb: string;
  email: string;
  placeholder: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "student",
    label: "Student",
    blurb: "Report issues",
    email: "student@demo.edu",
    placeholder: "e.g. student@demo.edu",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    id: "warden",
    label: "Warden",
    blurb: "Manage hostels",
    email: "warden@demo.edu",
    placeholder: "e.g. warden@demo.edu",
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    id: "worker",
    label: "Maintenance",
    blurb: "Resolve tickets",
    email: "worker@demo.edu",
    placeholder: "e.g. worker@demo.edu",
    icon: <Wrench className="h-6 w-6" />,
  },
  {
    id: "admin",
    label: "Official",
    blurb: "Oversight",
    email: "admin@demo.edu",
    placeholder: "e.g. admin@demo.edu",
    icon: <Shield className="h-6 w-6" />,
  },
];

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<UserRole>("student");
  const [email, setEmail] = useState(DEMO_MODE ? "student@demo.edu" : "");
  const [password, setPassword] = useState(DEMO_MODE ? "demo1234" : "");

  const activeRole = roles.find((r) => r.id === selected) ?? roles[0];

  function pickRole(role: (typeof roles)[number]) {
    setSelected(role.id);
    if (DEMO_MODE) {
      setEmail(role.email);
      setPassword("demo1234");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto grid w-full max-w-[1200px] items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: campus image + branding (Stitch) */}
        <div className="relative hidden min-h-[640px] overflow-hidden rounded-xl border border-outline-variant/30 shadow-md lg:flex">
          <Image
            src="/images/campus-hero.jpg"
            alt="Modern university campus building at golden hour"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="absolute inset-0 z-10 bg-navy-deep/25 mix-blend-multiply" />
          <div className="absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-navy-deep/95 via-navy/50 to-transparent p-8 xl:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5" />
                Institutional operations
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white xl:text-5xl">
                {APP_NAME}
              </h1>
              <p className="mt-3 max-w-md text-lg text-slate-200">
                Institutional Management & Systematic Resolution.
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-200 xl:text-base">
              A unified platform ensuring trust, accountability, and operational clarity across the
              academic community.
            </p>
          </div>
        </div>

        {/* Right: login card */}
        <div className="flex w-full max-w-md flex-col justify-center self-center lg:max-w-none lg:justify-center">
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-semibold text-navy">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Institutional Management</p>
          </div>

          <div className="rounded-xl border border-outline-variant/50 bg-white p-6 shadow-[0px_10px_25px_rgba(0,0,0,0.05)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-navy">Welcome Back</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Please select your role and sign in to continue.
              </p>
            </div>

            <form
              className="space-y-6"
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const timeout = window.setTimeout(() => {
                    setError("Sign-in is taking too long. Check your connection and try again.");
                  }, 15000);
                  try {
                    const res = await loginAction(fd);
                    if (res?.error) setError(res.error);
                  } catch {
                    // redirect() throws; ignore unless still pending with error
                  } finally {
                    window.clearTimeout(timeout);
                  }
                });
              }}
            >
              <div>
                <Label className="mb-3 block text-sm font-medium tracking-wide text-on-surface">
                  Select Role
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const isSelected = selected === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => pickRole(role)}
                        className={cn(
                          "relative rounded-lg border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_10px_25px_rgba(0,33,71,0.1)]",
                          isSelected
                            ? "border-royal bg-muted shadow-[0px_4px_12px_rgba(0,33,71,0.08)]"
                            : "border-outline-variant bg-white hover:border-royal",
                        )}
                      >
                        <span
                          className={cn(
                            "mb-2 block",
                            isSelected ? "text-royal" : "text-on-surface-variant",
                          )}
                        >
                          {role.icon}
                        </span>
                        <h3 className="text-sm font-semibold text-navy">{role.label}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">
                          {role.blurb}
                        </p>
                        <CheckCircle2
                          className={cn(
                            "absolute top-3 right-3 h-4 w-4 text-royal transition-opacity",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">University ID / Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={activeRole.placeholder}
                      required
                      className="rounded-lg py-5 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-xs font-semibold text-royal/70">Forgot password?</span>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="rounded-lg py-5 pl-10"
                    />
                  </div>
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-lg bg-navy-deep text-sm font-semibold tracking-wide hover:bg-navy"
              >
                {pending ? "Signing in…" : "Sign In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-sm text-on-surface-variant">
                New here?{" "}
                <Link href="/signup" className="font-semibold text-royal hover:underline">
                  Create an account
                </Link>
              </p>
              {DEMO_MODE ? (
                <div
                  className="rounded-lg border border-royal/30 bg-muted px-3 py-2 text-center text-xs text-on-surface-variant"
                  role="note"
                >
                  <p className="font-semibold text-navy">Demo Mode</p>
                  <p>
                    Role cards fill demo emails. Password for all demo accounts:{" "}
                    <span className="font-medium text-navy">demo1234</span>
                  </p>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
