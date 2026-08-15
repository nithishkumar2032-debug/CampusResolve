"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
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
import { APP_NAME } from "@/lib/constants";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const roles: {
  id: UserRole;
  label: string;
  blurb: string;
  placeholder: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "student",
    label: "Student",
    blurb: "Report issues",
    placeholder: "you@college.edu",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    id: "warden",
    label: "Warden",
    blurb: "Manage hostels",
    placeholder: "warden@college.edu",
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    id: "worker",
    label: "Maintenance",
    blurb: "Resolve tickets",
    placeholder: "tech@college.edu",
    icon: <Wrench className="h-6 w-6" />,
  },
  {
    id: "admin",
    label: "Official",
    blurb: "Oversight",
    placeholder: "admin@college.edu",
    icon: <Shield className="h-6 w-6" />,
  },
];

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imgOk, setImgOk] = useState(true);

  const activeRole = roles.find((r) => r.id === selected) ?? roles[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto grid w-full max-w-[1200px] items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative hidden min-h-[640px] overflow-hidden rounded-xl border border-outline-variant/30 bg-navy-deep shadow-md lg:flex">
          {imgOk ? (
            <Image
              src="/images/campus-hero-hd.jpg"
              alt="Modern university campus building at golden hour"
              fill
              priority
              quality={95}
              className="object-cover object-center"
              sizes="(min-width: 1024px) 50vw, 100vw"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy to-teal-800" aria-hidden />
          )}
          <div className="absolute inset-0 z-10 bg-navy-deep/20 mix-blend-multiply" />
          <div className="absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-navy-deep/90 via-navy/40 to-transparent p-8 xl:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5" />
                Institutional operations
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white xl:text-5xl">{APP_NAME}</h1>
              <p className="mt-3 max-w-md text-lg text-slate-200">
                Permanent complaint tracking with accountable resolution.
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-200 xl:text-base">
              Sign in with your CampusResolve account. Install from your browser for a standalone
              experience.
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col justify-center self-center lg:max-w-none">
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-semibold text-navy">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Institutional Management</p>
          </div>

          <div className="rounded-xl border border-outline-variant/50 bg-white p-6 shadow-[0px_10px_25px_rgba(0,0,0,0.05)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-navy">Welcome Back</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Select your role for guidance, then sign in with your email and password.
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
                    /* redirect throws */
                  } finally {
                    window.clearTimeout(timeout);
                  }
                });
              }}
            >
              <input type="hidden" name="next" value={next} />
              <div>
                <Label className="mb-3 block text-sm font-medium">Select Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const isSelected = selected === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelected(role.id)}
                        className={cn(
                          "relative rounded-lg border p-4 text-left transition-all",
                          isSelected
                            ? "border-royal bg-muted"
                            : "border-outline-variant bg-white hover:border-royal",
                        )}
                      >
                        <span className={cn("mb-2 block", isSelected ? "text-royal" : "text-on-surface-variant")}>
                          {role.icon}
                        </span>
                        <h3 className="text-sm font-semibold text-navy">{role.label}</h3>
                        <p className="mt-1 text-xs text-on-surface-variant">{role.blurb}</p>
                        <CheckCircle2
                          className={cn(
                            "absolute top-3 right-3 h-4 w-4 text-royal",
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
                    <Mail className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-on-surface-variant" />
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
                    <Link href="/forgot-password" className="text-xs font-semibold text-royal hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-on-surface-variant" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-lg py-5 pl-10"
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-lg bg-navy-deep font-semibold hover:bg-navy"
              >
                {pending ? "Signing in…" : "Sign In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-sm text-on-surface-variant">
                New student?{" "}
                <Link href="/signup" className="font-semibold text-royal hover:underline">
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
