// Shared abuse-resistance helpers for edge functions.
// Bundled independently per function by Supabase — import with a relative path:
//   import { ... } from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ethiscan-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Best-effort client IP from proxy headers Supabase forwards. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Lightweight shared-token gate. Returns true when the request may proceed.
 * If SCAN_ACCESS_TOKEN is not configured we fail OPEN (with a warning) so a
 * missing secret can't take the whole service down mid-residency — the rate
 * limiter remains the real protection.
 */
export function hasValidAccessToken(req: Request): boolean {
  const expected = Deno.env.get("SCAN_ACCESS_TOKEN");
  if (!expected) {
    console.warn("SCAN_ACCESS_TOKEN not configured — skipping access-token check.");
    return true;
  }
  return req.headers.get("x-ethiscan-token") === expected;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

/**
 * Per-IP fixed-window rate limit backed by the `rate_limit_counters` table via
 * the atomic `check_rate_limit` RPC. Caps are env-configurable:
 *   RATE_LIMIT_MAX (default 5), RATE_LIMIT_WINDOW_SECONDS (default 3600).
 * Fails OPEN on any infrastructure error so a limiter outage can't block scans.
 */
export async function checkRateLimit(bucket: string, identifier: string): Promise<RateLimitResult> {
  const limit = Number(Deno.env.get("RATE_LIMIT_MAX") ?? "5");
  const windowSeconds = Number(Deno.env.get("RATE_LIMIT_WINDOW_SECONDS") ?? "3600");
  const openResult: RateLimitResult = { allowed: true, remaining: limit, retryAfterSeconds: 0, limit };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.warn("Supabase service credentials missing — skipping rate limit.");
    return openResult;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_identifier: identifier,
      p_max: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Rate limit RPC error:", error.message);
      return openResult;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return openResult;
    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      retryAfterSeconds: Number(row.retry_after_seconds ?? windowSeconds),
      limit,
    };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return openResult;
  }
}

/** Builds the 401 response for a missing/invalid access token. */
export function accessDeniedResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Missing or invalid access token." }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/** Builds a 429 response with a human-readable, UI-displayable message. */
export function rateLimitedResponse(result: RateLimitResult): Response {
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
  return new Response(
    JSON.stringify({
      error: `Rate limit reached — up to ${result.limit} scans per hour per user. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}

/**
 * Runs the access-token gate then the rate limiter. Returns a Response to send
 * back immediately when the request should be rejected, or null to proceed.
 */
export async function guardRequest(req: Request, bucket: string): Promise<Response | null> {
  if (!hasValidAccessToken(req)) return accessDeniedResponse();
  const result = await checkRateLimit(bucket, getClientIp(req));
  if (!result.allowed) return rateLimitedResponse(result);
  return null;
}
