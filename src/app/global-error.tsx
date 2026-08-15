"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          An unexpected error occurred. You can try again. If the problem continues, sign out and
          sign back in.
        </p>
        <p className="mt-2 text-xs text-slate-400">{error.digest ?? error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
