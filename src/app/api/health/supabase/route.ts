import { NextResponse } from "next/server";
import {
  getSupabasePublicEnv,
  normalizeSupabaseUrl,
} from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public diagnostics for Vercel/Supabase misconfiguration.
 * Never returns secrets — only host shape + reachability.
 */
export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const normalized = normalizeSupabaseUrl(rawUrl);
  const env = getSupabasePublicEnv();

  let reachable: boolean | null = null;
  let reachError: string | null = null;

  if (env) {
    try {
      const res = await fetch(`${env.url}/auth/v1/health`, {
        method: "GET",
        headers: {
          apikey: env.key,
          Authorization: `Bearer ${env.key}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      reachable = res.ok || res.status === 401 || res.status === 404;
      if (!reachable) {
        reachError = `HTTP ${res.status}`;
      }
    } catch (err) {
      reachable = false;
      reachError = err instanceof Error ? err.message : "fetch failed";
    }
  }

  const ok = Boolean(env && reachable);

  return NextResponse.json({
    ok,
    configured: Boolean(env),
    hasUrl: Boolean(rawUrl?.trim()),
    hasAnonKey,
    urlHost: normalized?.host ?? null,
    urlValid: Boolean(normalized),
    reachable,
    reachError,
    appUrlSet: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    hint: ok
      ? "Supabase public env looks reachable from this deployment."
      : !hasAnonKey || !normalized
        ? "Set Production NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co (no /rest/v1) and NEXT_PUBLIC_SUPABASE_ANON_KEY to match local .env.local, then Redeploy."
        : "URL/key are set but Auth is unreachable from Vercel (wrong host, paused project, or network). Compare URL host to local Project URL.",
  });
}
