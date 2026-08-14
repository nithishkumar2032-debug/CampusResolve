import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Wrench,
  ShieldAlert,
  PlusCircle,
} from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { APP_NAME, ROLE_HOME } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HelpAssistant } from "@/components/help-assistant";
import { Button } from "@/components/ui/button";

function defaultNav(role: UserRole): { href: string; label: string; icon: React.ReactNode }[] {
  switch (role) {
    case "student":
      return [
        { href: "/student", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/student/new", label: "New Request", icon: <PlusCircle className="h-4 w-4" /> },
      ];
    case "warden":
      return [
        { href: "/warden", label: "Complaints", icon: <ClipboardList className="h-4 w-4" /> },
      ];
    case "worker":
      return [
        { href: "/worker", label: "My Tasks", icon: <Wrench className="h-4 w-4" /> },
      ];
    case "admin":
      return [
        { href: "/admin", label: "Escalations", icon: <ShieldAlert className="h-4 w-4" /> },
        { href: "/warden", label: "All Queue", icon: <ClipboardList className="h-4 w-4" /> },
      ];
  }
}

export function AppShell({
  user,
  nav,
  children,
  title,
  subtitle,
  actions,
}: {
  user: Profile;
  nav?: { href: string; label: string }[];
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const items =
    nav?.map((n) => ({
      ...n,
      icon: <LayoutDashboard className="h-4 w-4" />,
    })) ?? defaultNav(user.role);

  const home = ROLE_HOME[user.role];

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-800 text-slate-100 lg:flex">
        <div className="border-b border-slate-700 px-5 py-5">
          <Link href={home} className="text-lg font-bold tracking-tight text-white">
            {APP_NAME}
          </Link>
          <p className="mt-1 text-xs capitalize text-slate-400">{user.role} portal</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          {user.role === "student" ? (
            <Link
              href="/student/new"
              className="mt-4 flex items-center justify-center gap-2 rounded bg-royal px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              New Request
            </Link>
          ) : null}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full border-slate-600 bg-transparent text-slate-100 hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant bg-white px-4 py-3 lg:hidden">
        <div>
          <Link href={home} className="text-base font-bold text-navy">
            {APP_NAME}
          </Link>
          <p className="text-xs capitalize text-on-surface-variant">{user.role}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 hidden border-b border-outline-variant bg-white/95 px-6 py-4 backdrop-blur lg:block">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
              {subtitle ? (
                <p className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</p>
              ) : null}
            </div>
            {actions}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
          <div className="mb-4 lg:hidden">
            <h1 className="text-xl font-semibold text-navy">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</p>
            ) : null}
            {actions ? <div className="mt-3">{actions}</div> : null}
          </div>

          {/* Mobile nav chips */}
          <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded border border-outline-variant bg-white px-3 py-1.5 text-xs font-medium text-navy",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {children}
        </main>
      </div>

      <HelpAssistant role={user.role} />
    </div>
  );
}
