/** Strip BOM / wrapping quotes / whitespace from dashboard-pasted values. */
function cleanEnvValue(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  let v = raw.trim().replace(/^\uFEFF/, "");
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

/**
 * Project URL must be the API root from Supabase → Settings → API, e.g.
 * `https://xxxx.supabase.co` — not `/rest/v1`, not the DB connection string.
 */
export function normalizeSupabaseUrl(raw: string | undefined): {
  url: string;
  host: string;
} | null {
  const cleaned = cleanEnvValue(raw);
  if (!cleaned) return null;

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;

  const host = parsed.hostname.toLowerCase();
  const looksLikeSupabase =
    host.endsWith(".supabase.co") ||
    host.endsWith(".supabase.in") ||
    host === "localhost" ||
    host === "127.0.0.1";
  if (!looksLikeSupabase) return null;

  // Reject common paste mistakes: API paths, query strings, fragments
  const path = parsed.pathname.replace(/\/+$/, "");
  if (path && path !== "") return null;
  if (parsed.search || parsed.hash) return null;

  return { url: `https://${parsed.host}`, host: parsed.host };
}

export type SupabasePublicEnv = { url: string; key: string; host: string };

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const normalized = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!normalized || !key) return null;
  return { url: normalized.url, key, host: normalized.host };
}

export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Misconfigured Supabase: set NEXT_PUBLIC_SUPABASE_URL to https://YOUR_PROJECT.supabase.co (no /rest/v1) and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) on this environment.",
    );
  }
  return env;
}

/** Map opaque network errors to an actionable message for login/signup UI. */
export function formatSupabaseAuthError(error: {
  message?: string;
  name?: string;
  status?: number;
}): string {
  const message = (error.message || "").trim() || "Authentication failed";
  const lower = message.toLowerCase();

  if (
    lower === "fetch failed" ||
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    error.name === "AuthRetryableFetchError"
  ) {
    const host = getSupabasePublicEnv()?.host;
    return host
      ? `Cannot reach Supabase at ${host}. On Vercel, confirm Production NEXT_PUBLIC_SUPABASE_URL is exactly https://YOUR_PROJECT.supabase.co (same project as local), then redeploy.`
      : "Misconfigured Supabase: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing or invalid on this deployment. Set them in Vercel → Settings → Environment Variables (Production), then redeploy.";
  }

  return message;
}
