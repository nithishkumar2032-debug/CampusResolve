import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="text-2xl font-semibold text-navy">{APP_NAME}</h1>
      <p className="mt-3 max-w-md text-sm text-on-surface-variant">
        You appear to be offline. Reconnect to the internet to view complaints and continue working.
        Offline complaint submission is not available in this release.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white"
      >
        Try again
      </Link>
    </main>
  );
}
