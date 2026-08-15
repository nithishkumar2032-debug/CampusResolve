import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="text-2xl font-semibold text-navy">Page not found</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        The page or ticket you requested does not exist or you do not have access.
      </p>
      <Link href="/" className="mt-6 text-sm font-semibold text-royal hover:underline">
        Go home
      </Link>
    </main>
  );
}
