import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { APP_NAME } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { HelpAssistant } from "@/components/help-assistant";

export function AppShell({
  user,
  nav,
  children,
  title,
}: {
  user: Profile;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_45%,_#e2e8f0_100%)]">
      <header className="border-b border-teal-900/10 bg-teal-950 text-teal-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </Link>
            <nav className="hidden gap-3 text-sm text-teal-100/90 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-1 hover:bg-teal-900/50 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <p className="font-medium text-white">{user.full_name}</p>
              <p className="text-xs capitalize text-teal-200/80">{user.role}</p>
            </div>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-teal-400/40 bg-transparent text-teal-50 hover:bg-teal-900 hover:text-white"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {children}
      </main>
      <HelpAssistant role={user.role} />
    </div>
  );
}
